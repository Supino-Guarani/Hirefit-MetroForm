/* =========================================================
   METROFORM — FORMULÁRIOS
   JavaScript principal
========================================================= */


/* =========================================================
   1. CONTROLE DOS MODAIS
========================================================= */

function abrirModal(id) {

    const modal = document.getElementById(id);

    if (!modal) {
        console.warn(`Modal não encontrado: ${id}`);
        return;
    }

    modal.classList.add('ativo');

    document.body.classList.add('modal-aberto');
}


function fecharModal(id) {

    const modal = document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove('ativo');

    /*
     * Só libera o scroll quando não existir
     * nenhum outro modal aberto.
     */
    const outroModalAberto =
        document.querySelector('.modal-overlay.ativo');

    if (!outroModalAberto) {
        document.body.classList.remove('modal-aberto');
    }
}


/* =========================================================
   2. ABRIR MODAL DE NOVA PERGUNTA
========================================================= */

function abrirModalNovaPergunta(formularioId) {

    const modalId =
        `modalNovaPergunta-${formularioId}`;

    abrirModal(modalId);
}

/* =========================================================
   ADICIONAR VÁRIAS PERGUNTAS
========================================================= */

function adicionarNovaPergunta(formularioId) {

    const container =
        document.getElementById(
            `lista-novas-perguntas-${formularioId}`
        );

    if (!container) {
        console.warn(
            `Lista de perguntas não encontrada: ${formularioId}`
        );

        return;
    }


    /*
     * Clona a primeira pergunta como modelo.
     */

    const primeiraPergunta =
        container.querySelector('[data-pergunta]');

    if (!primeiraPergunta) {
        return;
    }


    const novaPergunta =
        primeiraPergunta.cloneNode(true);


    /*
     * Limpa os valores da nova pergunta.
     */

    const textarea =
        novaPergunta.querySelector(
            '[data-texto-pergunta]'
        );

    if (textarea) {
        textarea.value = '';
    }


    const checkbox =
        novaPergunta.querySelector(
            '[data-obrigatoria-pergunta]'
        );

    if (checkbox) {
        checkbox.checked = false;
    }


    /*
     * Remove todas as opções existentes.
     */

    const opcoes =
        novaPergunta.querySelector(
            '[data-opcoes]'
        );

    if (opcoes) {

        opcoes.innerHTML = `

            <div class="opcao-modal">

                <input
                    type="text"
                    data-opcao-texto
                    placeholder="Texto da opção"
                    required
                >

                <input
                    type="number"
                    data-opcao-pontos
                    value="0"
                    min="0"
                    placeholder="Pontos"
                    required
                >

                <button
                    type="button"
                    class="btn-remover-opcao"
                    onclick="removerOpcao(this)"
                    aria-label="Remover opção"
                >
                    ×
                </button>

            </div>

        `;

    }


    /*
     * Adiciona a nova pergunta.
     */

    container.appendChild(
        novaPergunta
    );


    atualizarNumeracaoPerguntas(
        formularioId
    );
}


/* =========================================================
   REMOVER PERGUNTA AINDA NÃO SALVA
========================================================= */

function removerPerguntaNova(botao) {

    const pergunta =
        botao.closest(
            '[data-pergunta]'
        );

    if (!pergunta) {
        return;
    }


    const container =
        pergunta.parentElement;


    /*
     * Não permite remover a última pergunta.
     */

    if (
        container.querySelectorAll(
            '[data-pergunta]'
        ).length <= 1
    ) {

        alert(
            'É necessário manter pelo menos uma pergunta.'
        );

        return;
    }


    pergunta.remove();


    /*
     * Atualiza os números.
     */

    const formularioId =
        container.id.replace(
            'lista-novas-perguntas-',
            ''
        );


    atualizarNumeracaoPerguntas(
        formularioId
    );
}

/* =========================================================
   ATUALIZAR NUMERAÇÃO DAS PERGUNTAS
========================================================= */

function atualizarNumeracaoPerguntas(formularioId) {

    const container =
        document.getElementById(
            `lista-novas-perguntas-${formularioId}`
        );

    if (!container) {
        return;
    }


    const perguntas =
        container.querySelectorAll(
            '[data-pergunta]'
        );


    perguntas.forEach(
        function (pergunta, index) {

            const numero =
                pergunta.querySelector(
                    '[data-numero-pergunta]'
                );

            if (numero) {

                numero.textContent =
                    index + 1;

            }

        }
    );
}


/* =========================================================
   ADICIONAR OPÇÃO EM UMA NOVA PERGUNTA
========================================================= */

function adicionarOpcaoNovaPergunta(botao) {

    const pergunta =
        botao.closest(
            '[data-pergunta]'
        );

    if (!pergunta) {
        return;
    }


    const container =
        pergunta.querySelector(
            '[data-opcoes]'
        );

    if (!container) {
        return;
    }


    const opcao =
        document.createElement('div');

    opcao.className =
        'opcao-modal';


    opcao.innerHTML = `

        <input
            type="text"
            data-opcao-texto
            placeholder="Texto da opção"
            required
        >

        <input
            type="number"
            data-opcao-pontos
            value="0"
            min="0"
            placeholder="Pontos"
            required
        >

        <button
            type="button"
            class="btn-remover-opcao"
            onclick="removerOpcao(this)"
            aria-label="Remover opção"
        >
            ×
        </button>

    `;


    container.appendChild(
        opcao
    );
}


/* =========================================================
   PREPARAR PERGUNTAS PARA ENVIO
========================================================= */

function prepararPerguntas(formularioId) {

    const container =
        document.getElementById(
            `lista-novas-perguntas-${formularioId}`
        );

    if (!container) {
        return false;
    }


    const perguntas =
        container.querySelectorAll(
            '[data-pergunta]'
        );


    const dados = [];


    perguntas.forEach(
        function (pergunta) {

            const texto =
                pergunta.querySelector(
                    '[data-texto-pergunta]'
                ).value.trim();


            const obrigatoria =
                pergunta.querySelector(
                    '[data-obrigatoria-pergunta]'
                ).checked;


            const opcoes =
                pergunta.querySelectorAll(
                    '[data-opcoes] .opcao-modal'
                );


            const dadosOpcoes = [];


            opcoes.forEach(
                function (opcao) {

                    const textoOpcao =
                        opcao.querySelector(
                            '[data-opcao-texto]'
                        ).value.trim();


                    const pontos =
                        opcao.querySelector(
                            '[data-opcao-pontos]'
                        ).value;


                    if (textoOpcao) {

                        dadosOpcoes.push({
                            texto: textoOpcao,
                            pontos: parseInt(pontos) || 0
                        });

                    }

                }
            );


            dados.push({

                texto: texto,

                obrigatoria: obrigatoria,

                opcoes: dadosOpcoes

            });

        }
    );


    /*
     * Coloca o JSON no campo hidden.
     */

    const campo =
        document.getElementById(
            `perguntas-json-${formularioId}`
        );


    if (!campo) {
        return false;
    }


    campo.value =
        JSON.stringify(dados);


    return true;
}

/* =========================================================
   ABRIR MODAL DE EDIÇÃO DA VAGA
========================================================= */

function abrirModalEditarVaga(formularioId) {

    const modalId =
        `modalEditarVaga-${formularioId}`;

    abrirModal(modalId);
}


/* =========================================================
   3. ABRIR MODAL DE EDITAR PERGUNTA
========================================================= */

function abrirModalPergunta(perguntaId) {

    const modalId =
        `modalEditarPergunta-${perguntaId}`;

    abrirModal(modalId);
}


/* =========================================================
   4. MOSTRAR / OCULTAR PERGUNTAS DA VAGA
========================================================= */

function togglePerguntas(formularioId) {

    const lista =
        document.getElementById(
            `perguntas-${formularioId}`
        );

    const botao =
        document.querySelector(
            `.btn-perguntas[data-formulario-id="${formularioId}"]`
        );

    const seta =
        document.getElementById(
            `seta-${formularioId}`
        );


    /*
     * Verifica se a lista realmente existe.
     */

    if (!lista) {
        console.warn(
            `Lista de perguntas não encontrada para a vaga: ${formularioId}`
        );

        return;
    }


    /*
     * Alterna o estado aberto/fechado.
     */

    const aberto =
        lista.classList.toggle('aberto');


    /*
     * Atualiza o botão.
     */

    if (botao) {
        botao.classList.toggle(
            'aberto',
            aberto
        );

        botao.setAttribute(
            'aria-expanded',
            aberto ? 'true' : 'false'
        );
    }


    /*
     * Atualiza a seta.
     */

    if (seta) {
        seta.classList.toggle(
            'aberto',
            aberto
        );
    }

}


/* =========================================================
   5. FECHAR MODAL CLICANDO NO FUNDO
========================================================= */

document.addEventListener(
    'click',
    function (event) {

        /*
         * Só fecha quando o clique for exatamente
         * no fundo escuro do modal.
         */

        if (
            event.target.classList.contains(
                'modal-overlay'
            )
        ) {

            event.target.classList.remove(
                'ativo'
            );


            /*
             * Verifica se existe outro modal aberto.
             */

            const outroModalAberto =
                document.querySelector(
                    '.modal-overlay.ativo'
                );


            if (!outroModalAberto) {

                document.body.classList.remove(
                    'modal-aberto'
                );

            }

        }

    }
);


/* =========================================================
   6. FECHAR MODAL COM ESC
========================================================= */

document.addEventListener(
    'keydown',
    function (event) {

        if (event.key !== 'Escape') {
            return;
        }


        const modaisAbertos =
            document.querySelectorAll(
                '.modal-overlay.ativo'
            );


        modaisAbertos.forEach(
            function (modal) {

                modal.classList.remove(
                    'ativo'
                );

            }
        );


        document.body.classList.remove(
            'modal-aberto'
        );

    }
);


/* =========================================================
   7. ADICIONAR OPÇÃO — NOVA PERGUNTA
========================================================= */

function adicionarOpcao(formularioId) {

    const container =
        document.getElementById(
            `opcoes-${formularioId}`
        );


    if (!container) {
        console.warn(
            `Container de opções não encontrado: opcoes-${formularioId}`
        );

        return;
    }


    const opcao =
        document.createElement('div');

    opcao.className =
        'opcao-modal';


    opcao.innerHTML = `

        <input
            type="text"
            name="opcao_texto"
            placeholder="Texto da opção"
            required
        >

        <input
            type="number"
            name="opcao_pontos"
            value="0"
            min="0"
            placeholder="Pontos"
            required
        >

        <button
            type="button"
            class="btn-remover-opcao"
            onclick="removerOpcao(this)"
            aria-label="Remover opção"
        >
            ×
        </button>

    `;


    container.appendChild(opcao);
}


/* =========================================================
   8. REMOVER OPÇÃO — NOVA PERGUNTA
========================================================= */

function removerOpcao(botao) {

    const opcao =
        botao.closest(
            '.opcao-modal'
        );


    if (!opcao) {
        return;
    }


    const container =
        opcao.parentElement;


    /*
     * Mantém pelo menos uma opção.
     */

    if (
        container.children.length <= 1
    ) {

        alert(
            'A pergunta precisa ter pelo menos uma opção.'
        );

        return;
    }


    opcao.remove();
}


/* =========================================================
   9. ADICIONAR OPÇÃO — EDIÇÃO
========================================================= */

function adicionarOpcaoEdicao(perguntaId) {

    const container =
        document.getElementById(
            `opcoes-edicao-${perguntaId}`
        );


    if (!container) {
        console.warn(
            `Container de opções não encontrado: opcoes-edicao-${perguntaId}`
        );

        return;
    }


    const opcao =
        document.createElement('div');

    opcao.className =
        'opcao-modal';


    opcao.innerHTML = `

        <input
            type="hidden"
            name="opcao_id"
            value=""
        >

        <input
            type="text"
            name="nova_opcao_texto"
            placeholder="Texto da opção"
            required
        >

        <input
            type="number"
            name="nova_opcao_pontos"
            value="0"
            min="0"
            placeholder="Pontos"
            required
        >

        <button
            type="button"
            class="btn-remover-opcao"
            onclick="removerOpcaoEdicao(this)"
            aria-label="Remover opção"
        >
            ×
        </button>

    `;


    container.appendChild(opcao);
}


/* =========================================================
   10. REMOVER OPÇÃO — EDIÇÃO
========================================================= */

function removerOpcaoEdicao(botao) {

    const opcao =
        botao.closest(
            '.opcao-modal'
        );


    if (!opcao) {
        return;
    }


    const container =
        opcao.parentElement;


    /*
     * Mantém pelo menos uma opção.
     */

    if (
        container.children.length <= 1
    ) {

        alert(
            'A pergunta precisa ter pelo menos uma opção.'
        );

        return;
    }


    /*
     * Verifica se a opção já existe no banco.
     */

    const idInput =
        opcao.querySelector(
            'input[name="opcao_id"]'
        );


    if (
        idInput &&
        idInput.value
    ) {

        const form =
            opcao.closest('form');


        if (form) {

            const inputRemovido =
                document.createElement(
                    'input'
                );


            inputRemovido.type =
                'hidden';

            inputRemovido.name =
                'opcoes_removidas';

            inputRemovido.value =
                idInput.value;


            form.appendChild(
                inputRemovido
            );

        }

    }


    opcao.remove();
}

/* =========================================================
   11. CRIAR NOVA PERGUNTA SEM SAIR DA PÁGINA
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const formularios =
            document.querySelectorAll(
                'form[action*="/pergunta/nova"]'
            );


        formularios.forEach(
            function (form) {

                form.addEventListener(
                    'submit',
                    async function (event) {

                        /*
                         * Impede o formulário HTML de
                         * navegar para outra página.
                         */
                        event.preventDefault();


                        const botao =
                            form.querySelector(
                                'button[type="submit"]'
                            );


                        /*
                         * Evita clique duplo.
                         */
                        if (botao) {

                            botao.disabled = true;

                            botao.textContent =
                                'Criando...';

                        }


                        try {

                            /*
                             * Envia o formulário via AJAX.
                             */
                            const resposta =
                                await fetch(
                                    form.action,
                                    {
                                        method: 'POST',

                                        body:
                                            new FormData(form),

                                        headers: {
                                            'X-Requested-With':
                                                'XMLHttpRequest'
                                        }
                                    }
                                );


                            /*
                             * Verifica erro HTTP.
                             */
                            if (!resposta.ok) {

                                throw new Error(
                                    `Erro HTTP ${resposta.status}`
                                );

                            }


                            /*
                             * Converte a resposta do Flask
                             * para JSON.
                             */
                            const dados =
                                await resposta.json();


                            /*
                             * Verifica se o Flask informou
                             * que houve algum erro.
                             */
                            if (!dados.sucesso) {

                                throw new Error(
                                    dados.erro ||
                                    'Não foi possível criar a pergunta.'
                                );

                            }


                            /*
                             * Pega o ID da vaga diretamente
                             * do modal onde este formulário está.
                             */
                            const modal =
                                form.closest(
                                    '.modal-overlay'
                                );


                            if (!modal) {

                                throw new Error(
                                    'Modal da pergunta não encontrado.'
                                );

                            }


                            /*
                             * Fecha o modal.
                             */
                            fecharModal(
                                modal.id
                            );


                            /*
                             * Limpa o formulário.
                             */
                            form.reset();


                            /*
                             * Recarrega a página ATUAL.
                             *
                             * Isso é diferente do redirect
                             * anterior para editar_formulario.
                             */
                            window.location.reload();


                        } catch (erro) {

                            console.error(
                                'Erro ao criar pergunta:',
                                erro
                            );


                            alert(
                                erro.message ||
                                'Não foi possível criar a pergunta.'
                            );


                            /*
                             * Reativa o botão.
                             */
                            if (botao) {

                                botao.disabled = false;

                                botao.textContent =
                                    'Criar pergunta';

                            }

                        }

                    }
                );

            }
        );

    }
);


/* =========================================================
   12. EDITAR VAGA SEM SAIR DA PÁGINA
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const formulariosEdicaoVaga =
            document.querySelectorAll(
                'form[action*="/formulario/"][action*="/editar"]'
            );


        formulariosEdicaoVaga.forEach(
            function (form) {

                form.addEventListener(
                    'submit',
                    async function (event) {

                        event.preventDefault();


                        const botao =
                            form.querySelector(
                                'button[type="submit"]'
                            );


                        if (botao) {

                            botao.disabled = true;

                            botao.textContent =
                                'Salvando...';

                        }


                        try {

                            const resposta =
                                await fetch(
                                    form.action,
                                    {
                                        method: 'POST',

                                        body:
                                            new FormData(form),

                                        headers: {
                                            'X-Requested-With':
                                                'XMLHttpRequest'
                                        }
                                    }
                                );


                            if (!resposta.ok) {

                                throw new Error(
                                    `Erro HTTP ${resposta.status}`
                                );

                            }


                            const dados =
                                await resposta.json();


                            if (!dados.sucesso) {

                                throw new Error(
                                    dados.erro ||
                                    'Não foi possível atualizar a vaga.'
                                );

                            }


                            /*
                             * Fecha o modal da vaga.
                             */
                            const modal =
                                form.closest(
                                    '.modal-overlay'
                                );


                            if (modal) {

                                fecharModal(
                                    modal.id
                                );

                            }


                            /*
                             * Atualiza a página atual para
                             * mostrar os novos dados da vaga.
                             */
                            window.location.reload();


                        } catch (erro) {

                            console.error(
                                'Erro ao editar vaga:',
                                erro
                            );


                            alert(
                                erro.message ||
                                'Não foi possível salvar as alterações.'
                            );


                            if (botao) {

                                botao.disabled = false;

                                botao.textContent =
                                    'Salvar alterações';

                            }

                        }

                    }
                );

            }
        );

    }
);


/* =========================================================
   13. EDITAR PERGUNTA SEM SAIR DA PÁGINA
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const formulariosEdicaoPergunta =
            document.querySelectorAll(
                'form[action*="/pergunta/"][action*="/editar"]'
            );


        formulariosEdicaoPergunta.forEach(
            function (form) {

                form.addEventListener(
                    'submit',
                    async function (event) {

                        event.preventDefault();


                        const botao =
                            form.querySelector(
                                'button[type="submit"]'
                            );


                        if (botao) {

                            botao.disabled = true;

                            botao.textContent =
                                'Salvando...';

                        }


                        try {

                            const resposta =
                                await fetch(
                                    form.action,
                                    {
                                        method: 'POST',

                                        body:
                                            new FormData(form),

                                        headers: {
                                            'X-Requested-With':
                                                'XMLHttpRequest'
                                        }
                                    }
                                );


                            if (!resposta.ok) {

                                throw new Error(
                                    `Erro HTTP ${resposta.status}`
                                );

                            }


                            const dados =
                                await resposta.json();


                            if (!dados.sucesso) {

                                throw new Error(
                                    dados.erro ||
                                    'Não foi possível atualizar a pergunta.'
                                );

                            }


                            /*
                             * Fecha o modal.
                             */
                            const modal =
                                form.closest(
                                    '.modal-overlay'
                                );


                            if (modal) {

                                fecharModal(
                                    modal.id
                                );

                            }


                            /*
                             * Atualiza a página atual para
                             * mostrar pergunta e opções atualizadas.
                             */
                            window.location.reload();


                        } catch (erro) {

                            console.error(
                                'Erro ao editar pergunta:',
                                erro
                            );


                            alert(
                                erro.message ||
                                'Não foi possível salvar as alterações.'
                            );


                            if (botao) {

                                botao.disabled = false;

                                botao.textContent =
                                    'Salvar alterações';

                            }

                        }

                    }
                );

            }
        );

    }
);