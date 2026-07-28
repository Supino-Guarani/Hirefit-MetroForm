
        function abrirModalRespostas(candidato) {
            // Preenche as informações básicas no Modal
            document.getElementById('modal-nome-candidato').textContent = candidato['Nome'] || 'Não informado';
            document.getElementById('modal-celular-candidato').textContent = candidato['Celular'] || 'Não informado';
            document.getElementById('modal-perfil-candidato').textContent = candidato['perfil_calculado'] || 'Sem perfil';

            const containerLista = document.getElementById('modal-lista-perguntas');
            containerLista.innerHTML = ''; // Limpa conteúdo anterior

            // Chaves que não devem aparecer como perguntas dinâmicas do questionário
            const camposExcluidos = [
                'Nome', 'Celular', 'Coloque o link do seu linkedin/currículo:',
                'perfil_calculado', 'pontos_ordenacao', 'pontos_admin', 'pontos_oper',
                'Carimbo de data/hora', 'Email', 'ID'
            ];

            let temRespostas = false;

            // Filtra e renderiza as perguntas reais do formulário
            for (const [campo, resposta] of Object.entries(candidato)) {
                const campoNormalizado = campo.trim().toLowerCase();

                // Converte a resposta para texto e remove espaços vazios
                const respostaTratada = (resposta !== null && resposta !== undefined) ? String(resposta).trim() : "";

                // REGRA AQUI: Só exibe se NÃO for campo administrativo E se a resposta NÃO estiver em branco
                if (!camposExcluidos.includes(campoNormalizado) && respostaTratada !== "") {

                    temRespostas = true;
                    const itemHTML = `
                <div class="modal-pergunta-item">
                    <div class="modal-pergunta-titulo">${campo}</div>
                    <div class="modal-resposta-candidato">${respostaTratada}</div>
                </div>
            `;
                    containerLista.insertAdjacentHTML('beforeend', itemHTML);
                }
            }

            if (!temRespostas) {
                containerLista.innerHTML = '<p style="color: #64748b; text-align: center;">Nenhuma resposta de questionário encontrada para este candidato.</p>';
            }

            // Abre o Modal
            document.getElementById('modal-respostas').style.display = 'block';
        }

        function abrirModalPorElemento(botao) {
            try {
                // Recupera o JSON que guardamos no atributo HTML
                const candidatoDados = JSON.parse(botao.getAttribute('data-candidato'));
                abrirModalRespostas(candidatoDados);
            } catch (erro) {
                console.error("Erro ao ler os dados do candidato:", erro);
                alert("Não foi possível carregar as respostas deste candidato.");
            }
        }

        function fecharModal() {
            document.getElementById('modal-respostas').style.display = 'none';
        }

        // Fecha se o usuário clicar em qualquer espaço fora da caixa do modal
        window.onclick = function (event) {
            const modal = document.getElementById('modal-respostas');
            if (event.target === modal) {
                fecharModal();
            }
        }
