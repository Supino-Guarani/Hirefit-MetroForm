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

    const outroModalAberto =
        document.querySelector('.modal-overlay.ativo');

    if (!outroModalAberto) {
        document.body.classList.remove('modal-aberto');
    }
}


/* =========================================================
   2. MODAL — NOVA PERGUNTA
========================================================= */

function abrirModalNovaPergunta(formularioId) {

    const modalId =
        `modalNovaPergunta-${formularioId}`;

    const modal =
        document.getElementById(modalId);

    if (!modal) {
        console.warn(
            `Modal de nova pergunta não encontrado: ${modalId}`
        );

        return;
    }

    /*
     * Sempre começa com o estado atual do formulário.
     *
     * Não recriamos o HTML inteiro.
     * Isso evita interferir nos outros elementos da página.
     */

    abrirModal(modalId);
}


/* =========================================================
   3. ADICIONAR OUTRA PERGUNTA
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
     * Usa a primeira pergunta existente como modelo.
     */

    const modelo =
        container.querySelector(
            '[data-pergunta]'
        );

    if (!modelo) {

        console.warn(
            'Modelo de pergunta não encontrado.'
        );

        return;
    }


    /*
     * Clona a pergunta.
     */

    const novaPergunta =
        modelo.cloneNode(true);


    /* =====================================================
       LIMPAR TEXTO
    ===================================================== */

    const textarea =
        novaPergunta.querySelector(
            '[data-texto-pergunta]'
        );

    if (textarea) {
        textarea.value = '';
    }


    /* =====================================================
       LIMPAR CHECKBOX
    ===================================================== */

    const checkbox =
        novaPergunta.querySelector(
            '[data-obrigatoria-pergunta]'
        );

    if (checkbox) {
        checkbox.checked = false;
    }


    /* =====================================================
       RESETAR OPÇÕES
    ===================================================== */

    const opcoes =
        novaPergunta.querySelector(
            '[data-opcoes]'
        );

    if (opcoes) {

        opcoes.innerHTML = '';

        adicionarOpcaoNovaPerguntaAoContainer(
            opcoes
        );
    }


    /*
     * Adiciona a nova pergunta.
     */

    container.appendChild(
        novaPergunta
    );


    /*
     * Atualiza a numeração.
     */

    atualizarNumeracaoPerguntas(
        formularioId
    );


    /*
     * Coloca o cursor no campo da nova pergunta.
     */

    if (textarea) {

        setTimeout(
            function () {

                textarea.focus();

            },
            50
        );
    }
}


/* =========================================================
   4. CRIAR OPÇÃO PADRÃO
========================================================= */

function adicionarOpcaoNovaPerguntaAoContainer(container) {

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
   5. REMOVER PERGUNTA NOVA
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

    if (!container) {
        return;
    }


    const perguntas =
        container.querySelectorAll(
            '[data-pergunta]'
        );


    /*
     * Mantém pelo menos uma pergunta.
     */

    if (perguntas.length <= 1) {

        alert(
            'É necessário manter pelo menos uma pergunta.'
        );

        return;
    }


    pergunta.remove();


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
   6. ATUALIZAR NUMERAÇÃO
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
   7. ADICIONAR OPÇÃO EM NOVA PERGUNTA
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


    adicionarOpcaoNovaPerguntaAoContainer(
        container
    );
}


/* =========================================================
   8. REMOVER OPÇÃO DE NOVA PERGUNTA
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

    if (!container) {
        return;
    }


    /*
     * Mantém pelo menos uma opção.
     */

    if (container.children.length <= 1) {

        alert(
            'A pergunta precisa ter pelo menos uma opção.'
        );

        return;
    }


    opcao.remove();
}


/* =========================================================
   9. PREPARAR TODAS AS PERGUNTAS
========================================================= */

function prepararPerguntas(formularioId) {

    const container =
        document.getElementById(
            `lista-novas-perguntas-${formularioId}`
        );

    if (!container) {

        console.error(
            `Container de perguntas não encontrado: ${formularioId}`
        );

        return false;
    }


    const perguntas =
        container.querySelectorAll(
            '[data-pergunta]'
        );


    if (perguntas.length === 0) {

        alert(
            'Adicione pelo menos uma pergunta.'
        );

        return false;
    }


    const dados = [];


    /*
     * Percorre TODAS as perguntas.
     */

    for (
        let i = 0;
        i < perguntas.length;
        i++
    ) {

        const pergunta =
            perguntas[i];


        /* =================================================
           TEXTO
        ================================================= */

        const campoTexto =
            pergunta.querySelector(
                '[data-texto-pergunta]'
            );


        if (!campoTexto) {

            alert(
                `Não foi possível encontrar o texto da pergunta ${i + 1}.`
            );

            return false;
        }


        const texto =
            campoTexto.value.trim();


        if (!texto) {

            alert(
                `Digite o texto da pergunta ${i + 1}.`
            );

            campoTexto.focus();

            return false;
        }


        /* =================================================
           OBRIGATÓRIA
        ================================================= */

        const campoObrigatoria =
            pergunta.querySelector(
                '[data-obrigatoria-pergunta]'
            );


        const obrigatoria =
            campoObrigatoria
                ? campoObrigatoria.checked
                : false;


        /* =================================================
           OPÇÕES
        ================================================= */

        const opcoes =
            pergunta.querySelectorAll(
                '[data-opcoes] .opcao-modal'
            );


        if (opcoes.length === 0) {

            alert(
                `A pergunta ${i + 1} precisa ter pelo menos uma opção.`
            );

            return false;
        }


        const dadosOpcoes = [];


        for (
            let j = 0;
            j < opcoes.length;
            j++
        ) {

            const opcao =
                opcoes[j];


            const campoTextoOpcao =
                opcao.querySelector(
                    '[data-opcao-texto]'
                );


            const campoPontos =
                opcao.querySelector(
                    '[data-opcao-pontos]'
                );


            if (
                !campoTextoOpcao ||
                !campoPontos
            ) {

                alert(
                    `Erro na opção ${j + 1} da pergunta ${i + 1}.`
                );

                return false;
            }


            const textoOpcao =
                campoTextoOpcao.value.trim();


            const pontosTexto =
                campoPontos.value;


            if (!textoOpcao) {

                alert(
                    `Digite o texto da opção ${j + 1} da pergunta ${i + 1}.`
                );

                campoTextoOpcao.focus();

                return false;
            }


            const pontos =
                parseInt(
                    pontosTexto,
                    10
                );


            dadosOpcoes.push({

                texto: textoOpcao,

                pontos:
                    Number.isNaN(pontos)
                        ? 0
                        : pontos

            });
        }


        /* =================================================
           MONTA A PERGUNTA
        ================================================= */

        dados.push({

            texto: texto,

            obrigatoria: obrigatoria,

            opcoes: dadosOpcoes

        });
    }


    /* =====================================================
       TRANSFORMA TUDO EM JSON
    ===================================================== */

    const campo =
        document.getElementById(
            `perguntas-json-${formularioId}`
        );


    if (!campo) {

        console.error(
            `Campo perguntas_json não encontrado: ${formularioId}`
        );

        return false;
    }


    campo.value =
        JSON.stringify(dados);


    console.log(
        'Perguntas preparadas para envio:',
        dados
    );


    return true;
}


/* =========================================================
   10. ABRIR MODAL DE EDITAR VAGA
========================================================= */

function abrirModalEditarVaga(formularioId) {

    const modalId =
        `modalEditarVaga-${formularioId}`;

    abrirModal(modalId);
}


/* =========================================================
   11. ABRIR MODAL DE EDITAR PERGUNTA
========================================================= */

function abrirModalPergunta(perguntaId) {

    const modalId =
        `modalEditarPergunta-${perguntaId}`;

    abrirModal(modalId);
}


/* =========================================================
   12. MOSTRAR / OCULTAR PERGUNTAS
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


    if (!lista) {

        console.warn(
            `Lista de perguntas não encontrada: ${formularioId}`
        );

        return;
    }


    const aberto =
        lista.classList.toggle(
            'aberto'
        );


    if (botao) {

        botao.classList.toggle(
            'aberto',
            aberto
        );


        botao.setAttribute(
            'aria-expanded',
            aberto
                ? 'true'
                : 'false'
        );
    }


    if (seta) {

        seta.classList.toggle(
            'aberto',
            aberto
        );
    }
}


/* =========================================================
   13. FECHAR MODAL CLICANDO NO FUNDO
========================================================= */

document.addEventListener(
    'click',
    function (event) {

        if (
            !event.target.classList.contains(
                'modal-overlay'
            )
        ) {
            return;
        }


        event.target.classList.remove(
            'ativo'
        );


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
);


/* =========================================================
   14. FECHAR MODAL COM ESC
========================================================= */

document.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key !== 'Escape'
        ) {
            return;
        }


        const modaisAbertos =
            document.querySelectorAll(
                '.modal-overlay.ativo'
            );


        if (
            modaisAbertos.length === 0
        ) {
            return;
        }


        /*
         * Fecha apenas os modais abertos.
         */

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
   15. ADICIONAR OPÇÃO — EDIÇÃO
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


    container.appendChild(
        opcao
    );
}


/* =========================================================
   16. REMOVER OPÇÃO — EDIÇÃO
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


    if (!container) {
        return;
    }


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
     * Verifica se a opção já existe
     * no banco de dados.
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
   17. EDITAR VAGA VIA AJAX
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

                            botao.disabled =
                                true;

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
                             * Atualiza somente a página atual.
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

                                botao.disabled =
                                    false;

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
   18. EDITAR PERGUNTA VIA AJAX
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

                            botao.disabled =
                                true;

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


                            const modal =
                                form.closest(
                                    '.modal-overlay'
                                );


                            if (modal) {

                                fecharModal(
                                    modal.id
                                );
                            }


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

                                botao.disabled =
                                    false;

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
   19. INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            'MetroForm — Formularios.js carregado.'
        );

    }
);



/* =========================================================
   14. NOVA CATEGORIA
========================================================= */

/*
 * Abre o modal de criação de categoria.
 */
function abrirModalNovaCategoria() {

    const modal =
        document.getElementById('modalNovaCategoria');

    if (!modal) {

        console.warn(
            'Modal de nova categoria não encontrado.'
        );

        return;
    }

    abrirModal('modalNovaCategoria');


    /*
     * Coloca o cursor automaticamente no campo.
     */
    setTimeout(function () {

        const campo =
            document.getElementById(
                'nova_categoria_nome'
            );

        if (campo) {
            campo.focus();
        }

    }, 100);

}


/* =========================================================
   SALVAR NOVA CATEGORIA
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const form =
            document.getElementById(
                'formNovaCategoria'
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const campo =
                    document.getElementById(
                        'nova_categoria_nome'
                    );

                const botao =
                    document.getElementById(
                        'btnSalvarCategoria'
                    );

                const erro =
                    document.getElementById(
                        'erro-nova-categoria'
                    );


                if (!campo) {
                    return;
                }


                const nome =
                    campo.value.trim();


                /*
                 * Limpa erro anterior.
                 */

                if (erro) {

                    erro.textContent = '';

                    erro.style.display =
                        'none';

                }


                /*
                 * Validação básica.
                 */

                if (!nome) {

                    mostrarErroCategoria(
                        'Digite o nome da categoria.'
                    );

                    campo.focus();

                    return;
                }


                /*
                 * Evita envio duplicado.
                 */

                if (botao) {

                    botao.disabled = true;

                    botao.textContent =
                        'Criando...';

                }


                try {

                    const resposta =
                        await fetch(
                            '/categoria/nova',
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json',

                                    'X-Requested-With':
                                        'XMLHttpRequest'
                                },

                                body:
                                    JSON.stringify({
                                        nome: nome
                                    })
                            }
                        );


                    const dados =
                        await resposta.json();


                    if (!resposta.ok || !dados.sucesso) {

                        throw new Error(
                            dados.erro ||
                            'Não foi possível criar a categoria.'
                        );

                    }


                    /*
                     * Adiciona a nova categoria
                     * aos selects da página.
                     */

                    adicionarCategoriaAosSelects(
                        dados.categoria
                    );


                    /*
                     * Seleciona automaticamente
                     * a categoria recém-criada
                     * no modal de nova vaga.
                     */

                    const selectNovaVaga =
                        document.getElementById(
                            'nova_categoria'
                        );

                    if (selectNovaVaga) {

                        selectNovaVaga.value =
                            dados.categoria.id;

                    }


                    /*
                     * Fecha o modal.
                     */

                    fecharModal(
                        'modalNovaCategoria'
                    );


                    /*
                     * Limpa o formulário.
                     */

                    form.reset();


                    /*
                     * Feedback visual.
                     */

                    console.log(
                        'Categoria criada:',
                        dados.categoria.nome
                    );


                } catch (erro) {

                    console.error(
                        'Erro ao criar categoria:',
                        erro
                    );


                    mostrarErroCategoria(
                        erro.message ||
                        'Não foi possível criar a categoria.'
                    );


                } finally {

                    /*
                     * Reativa o botão.
                     */

                    if (botao) {

                        botao.disabled = false;

                        botao.textContent =
                            'Criar categoria';

                    }

                }

            }
        );

    }
);


/* =========================================================
   MOSTRAR ERRO DA CATEGORIA
========================================================= */

function mostrarErroCategoria(mensagem) {

    const erro =
        document.getElementById(
            'erro-nova-categoria'
        );


    if (!erro) {
        return;
    }


    erro.textContent =
        mensagem;


    erro.style.display =
        'block';

}


/* =========================================================
   ADICIONAR CATEGORIA AOS SELECTS
========================================================= */

function adicionarCategoriaAosSelects(categoria) {

    if (!categoria || !categoria.nome) {
        return;
    }


    /*
     * Procura todos os selects de categoria.
     *
     * Isso inclui:
     *
     * - Nova vaga
     * - Editar vaga
     */

    const selects =
        document.querySelectorAll(
            'select[name="categoria_id"]'
        );


    selects.forEach(
        function (select) {

            /*
             * Verifica se a categoria
             * já existe nesse select.
             */

            const existente =
                Array.from(
                    select.options
                ).some(
                    function (option) {

                        return (
                            option.value ===
                            categoria.nome
                        );

                    }
                );


            /*
             * Se já existe, não duplica.
             */

            if (existente) {
                return;
            }


            /*
             * Cria a nova opção.
             */

            const option =
                document.createElement(
                    'option'
                );


            option.value =
                categoria.nome;

            option.textContent =
                categoria.nome;


            select.appendChild(
                option
            );

        }
    );

}