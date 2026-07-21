import json
import os
import pandas as pd
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from flask import Flask, render_template, request, redirect, url_for, session
from prisma import Prisma 

app = Flask(__name__)
app.secret_key = 'RecursosHumanos2026@'


db = Prisma()
db.connect()

CONFIG_FILE = 'config_perguntas.json'
#USUARIO_RH = "admin@hirefit.com"
#SENHA_RH = "rh1234"

def carregar_configuracoes():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    # Configuração padrão de fallback
    return {"nota_de_corte": 20, "regras": []}

def salvar_configuracoes(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4, ensure_ascii=False)

def calcular_perfil_dinamico(candidato, config):
    pontos_admin = 0
    pontos_oper = 0
    
    # Processa cada regra cadastrada dinamicamente pelo RH
    for regra in config.get("regras", []):
        pergunta = regra.get("pergunta")
        tipo = regra.get("tipo_pontuacao")
        resposta_candidato = candidato.get(pergunta, "").strip()
        
        if not resposta_candidato:
            continue
            
        valores = regra.get("respostas", {})
        
        if resposta_candidato in valores:
            pontos_fator = valores[resposta_candidato]
            if tipo == "admin_apenas":
                pontos_admin += int(pontos_fator)
            elif tipo == "oper_apenas":
                pontos_oper += int(pontos_fator)
            elif tipo == "dividida":
                pontos_admin += int(pontos_fator.get("admin", 0))
                pontos_oper += int(pontos_fator.get("oper", 0))

    # Lógica de Classificação Baseada no JSON
    nota_corte = config.get("nota_de_corte", 20)
    apto_admin = pontos_admin >= nota_corte
    apto_oper = pontos_oper >= nota_corte

    if apto_admin and apto_oper:
        status = "Apto para Ambos"
    elif apto_admin:
        status = "Administrativo"
    elif apto_oper:
        status = "Operacional"
    else:
        status = "Nenhum (Não Apto)"

    return {
        "status": status,
        "pontos_admin": pontos_admin,
        "pontos_oper": pontos_oper,
        "total": pontos_admin + pontos_oper
    }

@app.route("/")
def homepage():
    return render_template('index.html')

# --- ROTA DE LOGIN COM PRISMA ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email_input = request.form.get('email')
        senha_input = request.form.get('senha')
        
        # Busca o usuário no banco de dados pelo e-mail único
        usuario = db.usuario.find_unique(where={'email': email_input})
        
        # Verifica se o usuário existe e se a senha bate
        if usuario and usuario.senha == senha_input:
            session['usuario_logado'] = usuario.email
            session['nome_usuario'] = usuario.nome
            session['role'] = usuario.role
            
            if usuario.role == 'admin':
                return redirect(url_for('admin_usuarios_page'))
            else:
                return redirect(url_for('rh_dashboard'))
        else:
            return render_template('login.html', erro="Usuário ou senha incorretos.")
            
    return render_template('login.html')


# --- PAINEL DO ADMIN COM PRISMA ---
@app.route('/admin/usuarios', methods=['GET', 'POST'])
def admin_usuarios_page():
    if 'usuario_logado' not in session or session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    erro = None
    sucesso = None
    
    if request.method == 'POST':
        nome_input = request.form.get('nome')
        email_input = request.form.get('email')
        senha_input = request.form.get('senha')
        role_input = request.form.get('role', 'rh')
        
        # Verifica se o e-mail já está cadastrado no banco
        usuario_existente = db.usuario.find_unique(where={'email': email_input})
        
        if usuario_existente:
            erro = "Este e-mail já está cadastrado!"
        else:
            # Cria o novo usuário de forma cirúrgica no banco de dados
            db.usuario.create(data={
                'nome': nome_input,
                'email': email_input,
                'senha': senha_input,
                'role': role_input
            })
            sucesso = "Novo usuário de RH cadastrado com sucesso!"
            
    # Busca TODOS os usuários cadastrados para listar na tabela do HTML
    todos_usuarios = db.usuario.find_many()
    
    return render_template('AdminUsuarios.html', usuarios=todos_usuarios, erro=erro, sucesso=sucesso)


# --- DELETAR USUÁRIO COOM PRISMA ---
@app.route('/admin/deletar-usuario/<email>')
def deletar_usuario(email):
    if 'usuario_logado' not in session or session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    # Proteção para o admin principal
    if email == "admin@hirefit.com":
        return redirect(url_for('admin_usuarios_page'))
        
    # Deleta o registro baseado no e-mail único
    db.usuario.delete(where={'email': email})
    
    return redirect(url_for('admin_usuarios_page'))

@app.route('/homeRh')
def rh_dashboard():
    if 'usuario_logado' not in session or session.get('role') not in ['rh', 'admin']:
        return redirect(url_for('login'))
        
    URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQz0-d8M_B_1Mh6kabkVaNxjL-mVZXyqdLhkEUagg5BJAZX50u37ZlwBCEOBIMQnzQS_7twRxJpjUoO/pub?output=csv"
    config = carregar_configuracoes()
    
    try:
        df = pd.read_csv(URL_CSV)
        
        # Identificação automática da coluna de data
        coluna_data = None
        for col in ['Carimbo de data/hora', 'Timestamp', 'Date', 'Data']:
            if col in df.columns:
                coluna_data = col
                break
        
        if coluna_data and not df.empty:
            df[coluna_data] = pd.to_datetime(df[coluna_data], errors='coerce')
            limite_tempo = datetime.now() - timedelta(days=30)
            df = df[df[coluna_data] >= limite_tempo]
        
        df = df.fillna('')
        candidatos = df.to_dict(orient='records')
        
        for candidato in candidatos:
            calculo = calcular_perfil_dinamico(candidato, config)
            status = calculo['status']
            p_admin = calculo['pontos_admin']
            p_oper = calculo['pontos_oper']
            
            candidato['perfil_calculado'] = status
            candidato['pontos_admin'] = p_admin
            candidato['pontos_oper'] = p_oper
            candidato['pontos_total'] = calculo['total']
            
            if status == "Administrativo":
                candidato['pontos_ordenacao'] = p_admin
            elif status == "Operacional":
                candidato['pontos_ordenacao'] = p_oper
            elif status == "Apto para Ambos":
                candidato['pontos_ordenacao'] = max(p_admin, p_oper)
            else:
                candidato['pontos_ordenacao'] = 0
            
        candidatos.sort(key=lambda x: x['pontos_ordenacao'], reverse=True)
            
    except Exception as e:
        candidatos = []
        print(f"Erro ao ler/filtrar a planilha: {e}")

    return render_template('homeRh.html', candidatos=candidatos)

# ROTA PARA ATUALIZAR CONFIGURAÇÕES VIA PAINEL
@app.route('/salvar-regras', methods=['POST'])
def salvar_regras():
    if 'usuario_logado' not in session or session.get('role') not in ['rh', 'admin']:
        return redirect(url_for('login'))
        
    dados_recebidos = request.form.get('config_json')
    try:
        novo_json = json.loads(dados_recebidos)
        salvar_configuracoes(novo_json)
    except Exception as e:
        print(f"Erro ao decodificar JSON enviado: {e}")
        
    # ALTERADO AQUI: Redireciona de volta para a tela de edição
    return redirect(url_for('edit_rh_page'))


@app.route('/editRh')
def edit_rh_page():
    if 'usuario_logado' not in session or session.get('role')not in ['rh', 'admin']:
        return redirect(url_for('login'))
        
    config = carregar_configuracoes()
    return render_template('EditRH.html', config=config)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


if __name__ == "__main__":
    app.run(debug=True)