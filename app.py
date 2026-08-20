# pyrefly: ignore [missing-import]
import json
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, send_file
from prisma import Prisma 
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)

app = Flask(__name__)
app.secret_key = 'RecursosHumanos2026@'


db = Prisma()
db.connect()

def inicializar_categorias():

    categorias_padrao = [
        'Administrativo',
        'Operacional'
    ]

    for nome in categorias_padrao:

        categoria = db.categoria.find_unique(
            where={
                'nome': nome
            }
        )

        if not categoria:

            db.categoria.create(
                data={
                    'nome': nome
                }
            )


def atualizar_categorias_antigas():

    formularios = db.formulario.find_many()

    for formulario in formularios:

        # Se já possui categoria relacionada,
        # não precisamos fazer nada.
        if formulario.categoriaId:
            continue

        if not formulario.categoria:
            continue

        categoria = db.categoria.find_unique(
            where={
                'nome': formulario.categoria.strip()
            }
        )

        if not categoria:
            continue

        db.formulario.update(
            where={
                'id': formulario.id
            },
            data={
                'categoriaId': categoria.id
            }
        )

inicializar_categorias()
atualizar_categorias_antigas()

@app.route("/")
def homepage():
    formularios = db.formulario.find_many(
        where={'ativo': True},
        order={'criadoEm': 'desc'},
        include={
            'perguntas': {
                'include': {
                    'opcoes': True
                },
                'order_by': {
                    'ordem': 'asc'
                }
            }
        }
    )

    return render_template(
        'index.html',
        formularios=formularios
    )

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

    # =====================================================
    # FILTRO POR MÊS
    # =====================================================

    mes_filtro = request.args.get('mes', '').strip()

    # =====================================================
    # MONTA A CONSULTA
    # =====================================================

    where_candidatos = {}

    if mes_filtro:

        try:
            ano, mes = map(int, mes_filtro.split('-'))

            # Primeiro dia do mês selecionado
            data_inicio = datetime(ano, mes, 1)

            # Primeiro dia do mês seguinte
            if mes == 12:
                data_fim = datetime(ano + 1, 1, 1)
            else:
                data_fim = datetime(ano, mes + 1, 1)

            where_candidatos = {
                'criadoEm': {
                    'gte': data_inicio,
                    'lt': data_fim
                }
            }

        except (ValueError, TypeError):
            mes_filtro = ''
            where_candidatos = {}

    # =====================================================
    # BUSCA OS CANDIDATOS
    # =====================================================

    candidatos = db.candidato.find_many(
        where=where_candidatos,
        include={
            'formulario': True,
            'respostas': True
        },
        order={
            'criadoEm': 'desc'
        }
    )

    # =====================================================
    # AGRUPAR CANDIDATOS PELO E-MAIL
    # =====================================================

    candidatos_agrupados = {}

    for candidato in candidatos:

        email = candidato.email.strip().lower()

        if email not in candidatos_agrupados:

            candidatos_agrupados[email] = {
                'id': candidato.id,
                'nome': candidato.nome,
                'email': candidato.email,
                'telefone': candidato.telefone,
                'endereco': candidato.endereco,
                'linkedin': candidato.linkedin,

                'candidaturas': [],

                # Mantemos também para compatibilidade
                # com o JavaScript atual
                'pontuacao': 0,
                'formulario': None,
                'respostas': []
            }

        # =================================================
        # PROCESSA AS RESPOSTAS DESTA CANDIDATURA
        # =================================================

        respostas_view = []
        pontuacao = 0

        for resposta in candidato.respostas:

            pergunta = db.pergunta.find_unique(
                where={
                    'id': resposta.perguntaId
                }
            )

            opcao = db.opcao.find_unique(
                where={
                    'id': resposta.opcaoId
                }
            )

            pontos = opcao.pontos if opcao else 0

            pontuacao += pontos

            respostas_view.append({
                'pergunta': (
                    pergunta.texto
                    if pergunta
                    else 'Pergunta não encontrada'
                ),

                'resposta': (
                    opcao.texto
                    if opcao
                    else 'Resposta não informada'
                ),

                'pontos': pontos
            })

        # =================================================
        # VERIFICA APROVAÇÃO
        # =================================================

        nota_corte = candidato.formulario.notaCorte or 0

        aprovado = pontuacao >= nota_corte

        # =================================================
        # ADICIONA A CANDIDATURA
        # =================================================

        candidatos_agrupados[email]['candidaturas'].append({

            'id': candidato.id,

            'formulario': {
                'titulo': candidato.formulario.titulo,
                'categoria': candidato.formulario.categoria,
                'notaCorte': nota_corte
            },

            'respostas': respostas_view,

            'pontuacao': pontuacao,

            'aprovado': aprovado

        })

    # =====================================================
    # TRANSFORMA EM LISTA
    # =====================================================

    candidatos_view = list(
        candidatos_agrupados.values()
    )

    # =====================================================
    # CALCULA INFORMAÇÕES GERAIS
    # =====================================================

    for candidato in candidatos_view:

        # Mantém compatibilidade com o HTML/JS atual
        candidato['pontuacao'] = max(
            [
                candidatura['pontuacao']
                for candidatura in candidato['candidaturas']
            ],
            default=0
        )

        if candidato['candidaturas']:

            candidato['formulario'] = (
                candidato['candidaturas'][0]['formulario']
            )

            # Junta todas as respostas para compatibilidade
            # com o modal atual
            candidato['respostas'] = []

            for candidatura in candidato['candidaturas']:

                for resposta in candidatura['respostas']:

                    candidato['respostas'].append({

                        'vaga':
                            candidatura['formulario']['titulo'],

                        'pergunta':
                            resposta['pergunta'],

                        'resposta':
                            resposta['resposta'],

                        'pontos':
                            resposta['pontos']

                    })

    # =====================================================
    # ORDENA PELO MAIOR DESEMPENHO
    # =====================================================

    candidatos_view.sort(
        key=lambda candidato: candidato['pontuacao'],
        reverse=True
    )

    return render_template(
        'homeRh.html',
        candidatos=candidatos_view,
        mes_filtro=mes_filtro
    )


@app.route('/homeRh/candidato/<int:candidato_id>/pdf')
def gerar_pdf_candidato(candidato_id):

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    # =====================================================
    # BUSCA A CANDIDATURA ORIGINAL
    # =====================================================

    candidatura_original = db.candidato.find_unique(
        where={
            'id': candidato_id
        }
    )

    if not candidatura_original:
        return "Candidato não encontrado", 404

    email = candidatura_original.email

    # =====================================================
    # BUSCA TODAS AS CANDIDATURAS DO MESMO E-MAIL
    # =====================================================

    candidatos = db.candidato.find_many(
        where={
            'email': email
        },
        include={
            'formulario': True,
            'respostas': True
        },
        order={
            'criadoEm': 'asc'
        }
    )

    if not candidatos:
        return "Candidato não encontrado", 404

    # =====================================================
    # ESTILOS
    # =====================================================

    estilos = getSampleStyleSheet()

    titulo = ParagraphStyle(
        'TituloPDF',
        parent=estilos['Title'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#17375E'),
        spaceAfter=8
    )

    subtitulo = ParagraphStyle(
        'SubtituloPDF',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=20
    )

    secao = ParagraphStyle(
        'SecaoPDF',
        parent=estilos['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#17375E'),
        spaceBefore=12,
        spaceAfter=10
    )

    texto = ParagraphStyle(
        'TextoPDF',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1E293B')
    )

    pequeno = ParagraphStyle(
        'PequenoPDF',
        parent=estilos['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#64748B')
    )

    # =====================================================
    # CRIA PDF
    # =====================================================

    buffer = BytesIO()

    documento = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm
    )

    elementos = []

    primeiro = candidatos[0]

    # =====================================================
    # CABEÇALHO
    # =====================================================

    elementos.append(
        Paragraph(
            'MetroForm',
            titulo
        )
    )

    elementos.append(
        Paragraph(
            'Ficha completa do candidato',
            subtitulo
        )
    )

    elementos.append(
        HRFlowable(
            width='100%',
            thickness=1,
            color=colors.HexColor('#E2E8F0'),
            spaceAfter=15
        )
    )

    # =====================================================
    # DADOS DO CANDIDATO
    # =====================================================

    elementos.append(
        Paragraph(
            'Dados do candidato',
            secao
        )
    )

    dados_candidato = [
        [
            Paragraph('<b>Nome</b>', texto),
            Paragraph(primeiro.nome or 'Não informado', texto)
        ],
        [
            Paragraph('<b>E-mail</b>', texto),
            Paragraph(primeiro.email or 'Não informado', texto)
        ],
        [
            Paragraph('<b>Telefone</b>', texto),
            Paragraph(primeiro.telefone or 'Não informado', texto)
        ],
        [
            Paragraph('<b>Endereço</b>', texto),
            Paragraph(primeiro.endereco or 'Não informado', texto)
        ],
        [
            Paragraph('<b>LinkedIn</b>', texto),
            Paragraph(primeiro.linkedin or 'Não informado', texto)
        ]
    ]

    tabela_dados = Table(
        dados_candidato,
        colWidths=[4 * cm, 13 * cm]
    )

    tabela_dados.setStyle(
        TableStyle([
            (
                'BACKGROUND',
                (0, 0),
                (0, -1),
                colors.HexColor('#F1F5F9')
            ),
            (
                'BOX',
                (0, 0),
                (-1, -1),
                0.7,
                colors.HexColor('#E2E8F0')
            ),
            (
                'INNERGRID',
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor('#E2E8F0')
            ),
            (
                'VALIGN',
                (0, 0),
                (-1, -1),
                'TOP'
            ),
            (
                'LEFTPADDING',
                (0, 0),
                (-1, -1),
                9
            ),
            (
                'RIGHTPADDING',
                (0, 0),
                (-1, -1),
                9
            ),
            (
                'TOPPADDING',
                (0, 0),
                (-1, -1),
                8
            ),
            (
                'BOTTOMPADDING',
                (0, 0),
                (-1, -1),
                8
            )
        ])
    )

    elementos.append(tabela_dados)

    elementos.append(Spacer(1, 15))

    # =====================================================
    # TODAS AS CANDIDATURAS
    # =====================================================

    for numero_candidatura, candidato in enumerate(
        candidatos,
        start=1
    ):

        pontuacao = 0
        respostas = []

        for resposta in candidato.respostas:

            pergunta = db.pergunta.find_unique(
                where={
                    'id': resposta.perguntaId
                }
            )

            opcao = db.opcao.find_unique(
                where={
                    'id': resposta.opcaoId
                }
            )

            pontos = opcao.pontos if opcao else 0

            pontuacao += pontos

            respostas.append({
                'pergunta':
                    pergunta.texto
                    if pergunta
                    else 'Pergunta não encontrada',

                'resposta':
                    opcao.texto
                    if opcao
                    else 'Resposta não informada',

                'pontos':
                    pontos
            })

        nota_corte = candidato.formulario.notaCorte or 0

        aprovado = pontuacao >= nota_corte

        # =================================================
        # TÍTULO DA CANDIDATURA
        # =================================================

        elementos.append(
            Paragraph(
                f'Candidatura {numero_candidatura}: '
                f'{candidato.formulario.titulo}',
                secao
            )
        )

        # =================================================
        # STATUS
        # =================================================

        status = (
            'APROVADO'
            if aprovado
            else 'NÃO APROVADO'
        )

        cor_status = (
            '#16A34A'
            if aprovado
            else '#DC2626'
        )

        elementos.append(
            Paragraph(
                f'<b>Status:</b> '
                f'<font color="{cor_status}">'
                f'<b>{status}</b>'
                f'</font>',
                texto
            )
        )

        elementos.append(Spacer(1, 5))

        # =================================================
        # DADOS DA VAGA
        # =================================================

        dados_vaga = [
            [
                Paragraph('<b>Vaga</b>', texto),
                Paragraph(
                    candidato.formulario.titulo,
                    texto
                )
            ],
            [
                Paragraph('<b>Categoria</b>', texto),
                Paragraph(
                    candidato.formulario.categoria,
                    texto
                )
            ],
            [
                Paragraph('<b>Nota de corte</b>', texto),
                Paragraph(
                    str(nota_corte),
                    texto
                )
            ],
            [
                Paragraph('<b>Pontuação</b>', texto),
                Paragraph(
                    f'<b>{pontuacao} pts</b>',
                    texto
                )
            ]
        ]

        tabela_vaga = Table(
            dados_vaga,
            colWidths=[4 * cm, 13 * cm]
        )

        tabela_vaga.setStyle(
            TableStyle([
                (
                    'BACKGROUND',
                    (0, 0),
                    (0, -1),
                    colors.HexColor('#F1F5F9')
                ),
                (
                    'BOX',
                    (0, 0),
                    (-1, -1),
                    0.7,
                    colors.HexColor('#E2E8F0')
                ),
                (
                    'INNERGRID',
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor('#E2E8F0')
                ),
                (
                    'VALIGN',
                    (0, 0),
                    (-1, -1),
                    'TOP'
                ),
                (
                    'LEFTPADDING',
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    'RIGHTPADDING',
                    (0, 0),
                    (-1, -1),
                    9
                ),
                (
                    'TOPPADDING',
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    'BOTTOMPADDING',
                    (0, 0),
                    (-1, -1),
                    8
                )
            ])
        )

        elementos.append(tabela_vaga)

        elementos.append(Spacer(1, 10))

        # =================================================
        # RESPOSTAS
        # =================================================

        elementos.append(
            Paragraph(
                'Respostas',
                ParagraphStyle(
                    f'SubSecao{numero_candidatura}',
                    parent=secao,
                    fontSize=11,
                    spaceBefore=8,
                    spaceAfter=8
                )
            )
        )

        if not respostas:

            elementos.append(
                Paragraph(
                    'Nenhuma resposta registrada.',
                    pequeno
                )
            )

        else:

            for indice, resposta in enumerate(
                respostas,
                start=1
            ):

                elementos.append(
                    Paragraph(
                        f'<b>{indice}. '
                        f'{resposta["pergunta"]}</b>',
                        texto
                    )
                )

                elementos.append(
                    Paragraph(
                        f'Resposta: '
                        f'{resposta["resposta"]}',
                        texto
                    )
                )

                elementos.append(
                    Paragraph(
                        f'Pontuação: '
                        f'{resposta["pontos"]} pts',
                        pequeno
                    )
                )

                elementos.append(
                    Spacer(1, 7)
                )

        # Separador entre vagas
        if numero_candidatura < len(candidatos):

            elementos.append(
                Spacer(1, 10)
            )

            elementos.append(
                HRFlowable(
                    width='100%',
                    thickness=0.8,
                    color=colors.HexColor('#CBD5E1'),
                    spaceAfter=10
                )
            )

    # =====================================================
    # RODAPÉ
    # =====================================================

    elementos.append(
        Spacer(1, 20)
    )

    elementos.append(
        HRFlowable(
            width='100%',
            thickness=0.7,
            color=colors.HexColor('#E2E8F0'),
            spaceAfter=8
        )
    )

    elementos.append(
        Paragraph(
            'Documento gerado pelo sistema MetroForm.',
            pequeno
        )
    )

    # =====================================================
    # GERA PDF
    # =====================================================

    documento.build(elementos)

    buffer.seek(0)

    nome_arquivo = (
        f'candidato_{primeiro.id}.pdf'
    )

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=nome_arquivo
    )


# ============================================================
# GERENCIAMENTO DE FORMULÁRIOS / VAGAS
# ============================================================

@app.route('/editRh')
def edit_rh_page():

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    # =====================================================
    # BUSCA AS VAGAS
    # =====================================================

    formularios = db.formulario.find_many(
        order={'criadoEm': 'desc'},
        include={
            'categoriaRel': True,
            'perguntas': {
                'include': {
                    'opcoes': True
                },
                'order_by': {
                    'ordem': 'asc'
                }
            }
        }
    )

    # =====================================================
    # BUSCA AS CATEGORIAS ATIVAS
    # =====================================================

    categorias = db.categoria.find_many(
        where={
            'ativo': True
        },
        order={
            'nome': 'asc'
        }
    )

    # =====================================================
    # VAGA ABERTA
    # =====================================================

    vaga_aberta = request.args.get(
        'vaga',
        type=int
    )

    return render_template(
        'FormulariosRH.html',
        formularios=formularios,
        categorias=categorias,
        vaga_aberta=vaga_aberta
    )



# ============================================================
# CRIAR CATEGORIA
# ============================================================

@app.route('/categoria/nova', methods=['POST'])
def nova_categoria():

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    nome = request.form.get(
        'nome',
        ''
    ).strip()

    # =====================================================
    # VALIDAÇÃO
    # =====================================================

    if not nome:

        return {
            'sucesso': False,
            'erro': 'Informe o nome da categoria.'
        }, 400

    # =====================================================
    # PROCURA CATEGORIA EXISTENTE
    # =====================================================
    # Fazemos a comparação no Python para evitar duplicatas
    # como:
    #
    # Administrativo
    # administrativo
    # ADMINISTRATIVO
    #
    # Também removemos espaços extras.

    categorias = db.categoria.find_many()

    nome_normalizado = ' '.join(
        nome.split()
    ).casefold()

    for categoria in categorias:

        nome_existente = ' '.join(
            categoria.nome.split()
        ).casefold()

        if nome_existente == nome_normalizado:

            return {
                'sucesso': False,
                'erro': 'Esta categoria já existe.'
            }, 409

    # =====================================================
    # CRIA A CATEGORIA
    # =====================================================

    categoria = db.categoria.create(
        data={
            'nome': nome
        }
    )

    # =====================================================
    # RESPOSTA AJAX
    # =====================================================

    if request.headers.get(
        'X-Requested-With'
    ) == 'XMLHttpRequest':

        return {
            'sucesso': True,
            'mensagem': 'Categoria criada com sucesso.',
            'categoria': {
                'id': categoria.id,
                'nome': categoria.nome
            }
        }

    # =====================================================
    # ENVIO NORMAL
    # =====================================================

    return redirect(
        url_for('edit_rh_page')
    )


@app.route('/formulario/novo', methods=['POST'])
def novo_formulario():

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    titulo = request.form.get(
        'titulo',
        ''
    ).strip()

    descricao = request.form.get(
        'descricao',
        ''
    ).strip()

    categoria_id = request.form.get(
        'categoria_id',
        ''
    ).strip()

    nota_corte = request.form.get(
        'nota_corte',
        '0'
    )

    # =====================================================
    # VALIDAÇÃO DO TÍTULO
    # =====================================================

    if not titulo:
        return redirect(
            url_for('edit_rh_page')
        )

    # =====================================================
    # CONVERTE CATEGORIA
    # =====================================================

    try:
        categoria_id = int(categoria_id)
    except (ValueError, TypeError):
        categoria_id = None

    # =====================================================
    # BUSCA A CATEGORIA
    # =====================================================

    categoria = None

    if categoria_id:

        categoria = db.categoria.find_unique(
            where={
                'id': categoria_id
            }
        )

    # =====================================================
    # SE NÃO ENCONTROU CATEGORIA
    # =====================================================

    if not categoria:

        return redirect(
            url_for('edit_rh_page')
        )

    # =====================================================
    # CONVERTE NOTA DE CORTE
    # =====================================================

    try:
        nota_corte = int(nota_corte)

    except (ValueError, TypeError):
        nota_corte = 0

    # =====================================================
    # CRIA A VAGA
    # =====================================================

    formulario = db.formulario.create(
        data={
            'titulo': titulo,

            'descricao':
                descricao
                if descricao
                else None,

            # Mantemos o campo antigo funcionando
            'categoria':
                categoria.nome,

            # Nova relação
            'categoriaRel': {
                'connect': {
                    'id': categoria.id
                }
            },

            'notaCorte': nota_corte,

            'ativo': True
        }
    )

    # =====================================================
    # VOLTA PARA A VAGA CRIADA
    # =====================================================

    return redirect(
        url_for(
            'edit_rh_page',
            vaga=formulario.id
        )
    )

@app.route(
    '/formulario/<int:formulario_id>/editar',
    methods=['GET', 'POST']
)
def editar_formulario(formulario_id):

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    # =====================================================
    # BUSCA A VAGA
    # =====================================================

    formulario = db.formulario.find_unique(
        where={
            'id': formulario_id
        },
        include={
            'categoriaRel': True,
            'perguntas': {
                'include': {
                    'opcoes': True
                },
                'order_by': {
                    'ordem': 'asc'
                }
            }
        }
    )

    if not formulario:
        return redirect(
            url_for('edit_rh_page')
        )

    # =====================================================
    # POST
    # =====================================================

    if request.method == 'POST':

        titulo = request.form.get(
            'titulo',
            ''
        ).strip()

        descricao = request.form.get(
            'descricao',
            ''
        ).strip()

        categoria_id = request.form.get(
            'categoria_id',
            ''
        ).strip()

        nota_corte = request.form.get(
            'nota_corte',
            '0'
        )

        # =================================================
        # VALIDA TÍTULO
        # =================================================

        if not titulo:

            if request.headers.get(
                'X-Requested-With'
            ) == 'XMLHttpRequest':

                return {
                    'sucesso': False,
                    'erro': 'Informe o título da vaga.'
                }, 400

            return redirect(
                url_for(
                    'edit_rh_page',
                    vaga=formulario_id
                )
            )

        # =================================================
        # CONVERTE CATEGORIA
        # =================================================

        try:
            categoria_id = int(categoria_id)

        except (ValueError, TypeError):
            categoria_id = None

        # =================================================
        # BUSCA CATEGORIA
        # =================================================

        categoria = None

        if categoria_id:

            categoria = db.categoria.find_unique(
                where={
                    'id': categoria_id
                }
            )

        if not categoria:

            if request.headers.get(
                'X-Requested-With'
            ) == 'XMLHttpRequest':

                return {
                    'sucesso': False,
                    'erro': 'Selecione uma categoria válida.'
                }, 400

            return redirect(
                url_for(
                    'edit_rh_page',
                    vaga=formulario_id
                )
            )

        # =================================================
        # NOTA DE CORTE
        # =================================================

        try:
            nota_corte = int(nota_corte)

        except (ValueError, TypeError):
            nota_corte = 0

        # =================================================
        # ATUALIZA A VAGA
        # =================================================

        db.formulario.update(
            where={
                'id': formulario_id
            },
            data={

                'titulo': titulo,

                'descricao':
                    descricao
                    if descricao
                    else None,

                # Mantém compatibilidade
                'categoria':
                    categoria.nome,

                # Nova relação
                'categoriaRel': {
                    'connect': {
                        'id': categoria.id
                    }
                },

                'notaCorte': nota_corte
            }
        )

        # =================================================
        # RESPOSTA AJAX
        # =================================================

        if request.headers.get(
            'X-Requested-With'
        ) == 'XMLHttpRequest':

            return {
                'sucesso': True,
                'mensagem':
                    'Vaga atualizada com sucesso.',
                'formulario_id':
                    formulario_id
            }

        # =================================================
        # ENVIO NORMAL
        # =================================================

        return redirect(
            url_for(
                'edit_rh_page',
                vaga=formulario_id
            )
        )

    # =====================================================
    # GET
    # =====================================================

    return redirect(
        url_for(
            'edit_rh_page',
            vaga=formulario_id
        )
    )


@app.route(
    '/formulario/<int:formulario_id>/pergunta/nova',
    methods=['GET', 'POST']
)
def nova_pergunta(formulario_id):

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    # ============================================================
    # BUSCA A VAGA
    # ============================================================

    formulario = db.formulario.find_unique(
        where={'id': formulario_id},
        include={
            'perguntas': True
        }
    )

    if not formulario:

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return {
                'sucesso': False,
                'erro': 'Vaga não encontrada.'
            }, 404

        return redirect(url_for('edit_rh_page'))

    # ============================================================
    # CRIAÇÃO DA PERGUNTA
    # ============================================================

    if request.method == 'POST':

        texto = request.form.get(
            'texto',
            ''
        ).strip()

        obrigatoria = (
            request.form.get('obrigatoria') == 'on'
        )

        # ========================================================
        # VALIDAÇÃO
        # ========================================================

        if not texto:

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return {
                    'sucesso': False,
                    'erro': 'Digite o texto da pergunta.'
                }, 400

            return redirect(
                url_for(
                    'edit_rh_page',
                    vaga=formulario_id
                )
            )

        # ========================================================
        # DEFINE A ORDEM
        # ========================================================

        maior_ordem = max(
            [p.ordem for p in formulario.perguntas],
            default=0
        )

        nova_ordem = maior_ordem + 1

        # ========================================================
        # CRIA A PERGUNTA
        # ========================================================

        pergunta = db.pergunta.create(
            data={
                'texto': texto,
                'ordem': nova_ordem,
                'obrigatoria': obrigatoria,
                'formulario': {
                    'connect': {
                        'id': formulario_id
                    }
                }
            }
        )

        # ========================================================
        # RECEBE AS OPÇÕES
        # ========================================================

        textos_opcoes = request.form.getlist(
            'opcao_texto'
        )

        pontos_opcoes = request.form.getlist(
            'opcao_pontos'
        )

        ordem_opcao = 1

        # ========================================================
        # CRIA AS OPÇÕES
        # ========================================================

        for texto_opcao, pontos_opcao in zip(
            textos_opcoes,
            pontos_opcoes
        ):

            texto_opcao = texto_opcao.strip()

            if not texto_opcao:
                continue

            try:
                pontos = int(pontos_opcao)

            except (ValueError, TypeError):
                pontos = 0

            db.opcao.create(
                data={
                    'texto': texto_opcao,
                    'pontos': pontos,
                    'ordem': ordem_opcao,
                    'pergunta': {
                        'connect': {
                            'id': pergunta.id
                        }
                    }
                }
            )

            ordem_opcao += 1

        # ========================================================
        # RESPOSTA AJAX
        # ========================================================

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':

            return {
                'sucesso': True,
                'mensagem': 'Pergunta criada com sucesso.',
                'pergunta_id': pergunta.id,
                'formulario_id': formulario_id
            }

        # ========================================================
        # ENVIO NORMAL
        # ========================================================

        return redirect(
            url_for(
                'edit_rh_page',
                vaga=formulario_id
            )
        )

    # ============================================================
    # GET
    # ============================================================
    # Não precisamos mais de NovaPergunta.html.

    return redirect(
        url_for(
            'edit_rh_page',
            vaga=formulario_id
        )
    )

@app.route(
    '/pergunta/<int:pergunta_id>/editar',
    methods=['GET', 'POST']
)
def editar_pergunta(pergunta_id):

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))

    pergunta = db.pergunta.find_unique(
        where={'id': pergunta_id},
        include={
            'opcoes': True,
            'formulario': True
        }
    )

    if not pergunta:
        return redirect(url_for('edit_rh_page'))

    if request.method == 'POST':

        texto = request.form.get(
            'texto',
            ''
        ).strip()

        obrigatoria = (
            request.form.get('obrigatoria') == 'on'
        )

        # ========================================================
        # VALIDAÇÃO
        # ========================================================

        if not texto:

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':

                return {
                    'sucesso': False,
                    'erro': 'Digite o texto da pergunta.'
                }, 400

            return redirect(
                url_for(
                    'edit_rh_page',
                    vaga=pergunta.formularioId
                )
            )

        # ========================================================
        # ATUALIZA A PERGUNTA
        # ========================================================

        db.pergunta.update(
            where={
                'id': pergunta_id
            },
            data={
                'texto': texto,
                'obrigatoria': obrigatoria
            }
        )

        # ========================================================
        # OPÇÕES EXISTENTES
        # ========================================================

        opcoes_ids = request.form.getlist(
            'opcao_id'
        )

        textos_opcoes = request.form.getlist(
            'opcao_texto'
        )

        pontos_opcoes = request.form.getlist(
            'opcao_pontos'
        )

        opcoes_removidas = request.form.getlist(
            'opcoes_removidas'
        )

        # ========================================================
        # EXCLUI OPÇÕES REMOVIDAS
        # ========================================================

        for opcao_id in opcoes_removidas:

            try:

                opcao_id = int(opcao_id)

                db.opcao.delete(
                    where={
                        'id': opcao_id
                    }
                )

            except (ValueError, TypeError):
                continue

        # ========================================================
        # ATUALIZA OPÇÕES EXISTENTES
        # ========================================================

        for opcao_id, texto_opcao, pontos_opcao in zip(
            opcoes_ids,
            textos_opcoes,
            pontos_opcoes
        ):

            if not opcao_id:
                continue

            texto_opcao = texto_opcao.strip()

            if not texto_opcao:
                continue

            try:
                pontos = int(pontos_opcao)

            except (ValueError, TypeError):
                pontos = 0

            db.opcao.update(
                where={
                    'id': int(opcao_id)
                },
                data={
                    'texto': texto_opcao,
                    'pontos': pontos
                }
            )

        # ========================================================
        # NOVAS OPÇÕES
        # ========================================================

        novas_opcoes_texto = request.form.getlist(
            'nova_opcao_texto'
        )

        novas_opcoes_pontos = request.form.getlist(
            'nova_opcao_pontos'
        )

        maior_ordem = max(
            [
                opcao.ordem
                for opcao in pergunta.opcoes
            ],
            default=0
        )

        ordem_opcao = maior_ordem + 1

        for texto_opcao, pontos_opcao in zip(
            novas_opcoes_texto,
            novas_opcoes_pontos
        ):

            texto_opcao = texto_opcao.strip()

            if not texto_opcao:
                continue

            try:
                pontos = int(pontos_opcao)

            except (ValueError, TypeError):
                pontos = 0

            db.opcao.create(
                data={
                    'texto': texto_opcao,
                    'pontos': pontos,
                    'ordem': ordem_opcao,
                    'pergunta': {
                        'connect': {
                            'id': pergunta_id
                        }
                    }
                }
            )

            ordem_opcao += 1

        # ========================================================
        # RESPOSTA AJAX
        # ========================================================

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':

            return {
                'sucesso': True,
                'mensagem': 'Pergunta atualizada com sucesso.',
                'pergunta_id': pergunta_id,
                'formulario_id': pergunta.formularioId
            }

        # ========================================================
        # ENVIO NORMAL
        # ========================================================

        return redirect(
            url_for(
                'edit_rh_page',
                vaga=pergunta.formularioId
            )
        )

    # ============================================================
    # GET
    # ============================================================
    # A edição acontece pelo modal de FormulariosRH.html.

    return redirect(
        url_for(
            'edit_rh_page',
            vaga=pergunta.formularioId
        )
    )

@app.route('/pergunta/<int:pergunta_id>/excluir', methods=['POST'])
def excluir_pergunta(pergunta_id):

    if 'usuario_logado' not in session or session.get('role') not in ['rh', 'admin']:
        return redirect(url_for('login'))

    pergunta = db.pergunta.find_unique(
        where={'id': pergunta_id}
    )

    if not pergunta:
        return redirect(url_for('edit_rh_page'))

    formulario_id = pergunta.formularioId

    db.pergunta.delete(
        where={
            'id': pergunta_id
        }
    )

    return redirect(
        url_for(
            'editar_formulario',
            formulario_id=formulario_id
        )
    )

@app.route('/formulario/<int:formulario_id>/excluir', methods=['POST'])
def excluir_formulario(formulario_id):
    if 'usuario_logado' not in session or session.get('role') not in ['rh', 'admin']:
        return redirect(url_for('login'))

    formulario = db.formulario.find_unique(
        where={'id': formulario_id}
    )

    if formulario:
        db.formulario.delete(
            where={'id': formulario_id}
        )

    return redirect(url_for('edit_rh_page'))


@app.route(
    '/formulario/<int:formulario_id>/perguntas/salvar',
    methods=['POST']
)
def salvar_perguntas(formulario_id):

    print(
    f'========== SALVANDO PERGUNTAS =========='
    )
    print(
        f'FORMULARIO: {formulario_id}'
        )
    print(
    f'PERGUNTAS RECEBIDAS: {request.form.get("perguntas_json")}'
    )
    print(
        f'========================================='
        )

    if (
        'usuario_logado' not in session
        or session.get('role') not in ['rh', 'admin']
    ):
        return redirect(url_for('login'))


    # =====================================================
    # VERIFICA SE A VAGA EXISTE
    # =====================================================

    formulario = db.formulario.find_unique(
        where={
            'id': formulario_id
        },
        include={
            'perguntas': True
        }
    )


    if not formulario:
        return redirect(
            url_for('edit_rh_page')
        )


    # =====================================================
    # RECEBE AS PERGUNTAS
    # =====================================================

    perguntas_json = request.form.get(
        'perguntas_json',
        ''
    )


    if not perguntas_json:
        return redirect(
            url_for(
                'edit_rh_page',
                vaga=formulario_id
            )
        )


    try:

        perguntas = json.loads(
            perguntas_json
        )

    except (json.JSONDecodeError, TypeError):

        return redirect(
            url_for(
                'edit_rh_page',
                vaga=formulario_id
            )
        )


    # =====================================================
    # DEFINE A PRÓXIMA ORDEM
    # =====================================================

    maior_ordem = max(
        [
            pergunta.ordem
            for pergunta in formulario.perguntas
        ],
        default=0
    )


    ordem_pergunta = maior_ordem + 1


    # =====================================================
    # CRIA TODAS AS PERGUNTAS
    # =====================================================

    for dados_pergunta in perguntas:

        texto = str(
            dados_pergunta.get(
                'texto',
                ''
            )
        ).strip()


        if not texto:
            continue


        obrigatoria = bool(
            dados_pergunta.get(
                'obrigatoria',
                False
            )
        )


        # =================================================
        # CRIA PERGUNTA
        # =================================================

        pergunta = db.pergunta.create(
            data={

                'texto': texto,

                'ordem': ordem_pergunta,

                'obrigatoria': obrigatoria,

                'formulario': {
                    'connect': {
                        'id': formulario_id
                    }
                }

            }
        )


        # =================================================
        # OPÇÕES
        # =================================================

        opcoes = dados_pergunta.get(
            'opcoes',
            []
        )


        ordem_opcao = 1


        for dados_opcao in opcoes:

            texto_opcao = str(
                dados_opcao.get(
                    'texto',
                    ''
                )
            ).strip()


            if not texto_opcao:
                continue


            try:

                pontos = int(
                    dados_opcao.get(
                        'pontos',
                        0
                    )
                )

            except (
                ValueError,
                TypeError
            ):

                pontos = 0


            db.opcao.create(
                data={

                    'texto': texto_opcao,

                    'pontos': pontos,

                    'ordem': ordem_opcao,

                    'pergunta': {
                        'connect': {
                            'id': pergunta.id
                        }
                    }

                }
            )


            ordem_opcao += 1


        ordem_pergunta += 1


    # =====================================================
    # VOLTA PARA A PÁGINA
    # =====================================================

    return redirect(
        url_for(
            'edit_rh_page',
            vaga=formulario_id
        )
    )


@app.route('/formulario/<int:formulario_id>/alternar', methods=['POST'])
def alternar_formulario(formulario_id):
    if 'usuario_logado' not in session or session.get('role') not in ['rh', 'admin']:
        return redirect(url_for('login'))

    formulario = db.formulario.find_unique(
        where={'id': formulario_id}
    )

    if formulario:
        db.formulario.update(
            where={'id': formulario_id},
            data={
                'ativo': not formulario.ativo
            }
        )

    return redirect(url_for('edit_rh_page'))

@app.route('/formulario/<int:formulario_id>', methods=['POST'])
def responder_formulario(formulario_id):

    formulario = db.formulario.find_unique(
        where={'id': formulario_id},
        include={
            'perguntas': {
                'include': {
                    'opcoes': True
                },
                'order_by': {
                    'ordem': 'asc'
                }
            }
        }
    )

    # Verifica se a vaga existe e está ativa
    if not formulario or not formulario.ativo:
        return redirect(url_for('homepage'))

    # ============================
    # DADOS DO CANDIDATO
    # ============================

    nome = request.form.get('nome', '').strip()
    email = request.form.get('email', '').strip()
    telefone = request.form.get('telefone', '').strip()
    endereco = request.form.get('endereco', '').strip()
    linkedin = request.form.get('linkedin', '').strip()

    # ============================
    # VALIDAÇÕES BÁSICAS
    # ============================

    if not nome or not email or not telefone or not endereco:
        return redirect(url_for('homepage'))

    # ============================
    # CRIA O CANDIDATO
    # ============================

    candidato = db.candidato.create(
        data={
            'nome': nome,
            'email': email,
            'telefone': telefone,
            'endereco': endereco,
            'linkedin': linkedin,
            'formulario': {
                'connect': {
                    'id': formulario_id
                }
            }
        }
    )

    # ============================
    # SALVA AS RESPOSTAS
    # ============================

    for pergunta in formulario.perguntas:

        resposta = request.form.get(
            f'pergunta_{pergunta.id}'
        )

        if not resposta:
            continue

        # Procura a opção escolhida
        opcao_escolhida = None

        for opcao in pergunta.opcoes:

            if opcao.texto == resposta:
                opcao_escolhida = opcao
                break

        if not opcao_escolhida:
            continue

        db.resposta.create(
            data={
                'candidato': {
                    'connect': {
                        'id': candidato.id
                    }
                },
                'pergunta': {
                    'connect': {
                        'id': pergunta.id
                    }
                },
                'opcao': {
                    'connect': {
                        'id': opcao_escolhida.id
                    }
                }
            }
        )

    # ============================
    # FINALIZA
    # ============================

    return render_template(
        'CandidaturaEnviada.html',
        formulario=formulario,
        candidato=candidato
    )




@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


if __name__ == "__main__":
    app.run(debug=True)