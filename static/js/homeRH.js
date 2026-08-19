// ======================================================
// ABRIR MODAL DE RESPOSTAS
// ======================================================

function abrirModalPorElemento(botao) {

    console.log('Botão de respostas clicado');

    const modal =
        document.getElementById('modal-respostas');

    if (!modal) {

        console.error(
            'ERRO: #modal-respostas não foi encontrado.'
        );

        return;
    }


    // ==================================================
    // LER DADOS DO CANDIDATO
    // ==================================================

    let candidato;

    try {

        candidato = JSON.parse(
            botao.getAttribute('data-candidato')
        );

    } catch (erro) {

        console.error(
            'ERRO ao ler os dados do candidato:',
            erro
        );

        return;
    }


    console.log(
        'Candidato carregado:',
        candidato
    );


    // ==================================================
    // GUARDAR ID PARA O PDF
    // ==================================================

    modal.dataset.candidatoId =
        candidato.id;


    // ==================================================
    // DADOS PESSOAIS
    // ==================================================

    const nome =
        document.getElementById(
            'modal-nome-candidato'
        );

    const email =
        document.getElementById(
            'modal-email-candidato'
        );

    const telefone =
        document.getElementById(
            'modal-celular-candidato'
        );

    const vaga =
        document.getElementById(
            'modal-perfil-candidato'
        );

    const linkedin =
        document.getElementById(
            'modal-linkedin-candidato'
        );


    if (nome) {

        nome.textContent =
            candidato.nome || 'Não informado';

    }


    if (email) {

        email.textContent =
            candidato.email || 'Não informado';

    }


    if (telefone) {

        telefone.textContent =
            candidato.telefone || 'Não informado';

    }


    // ==================================================
    // TODAS AS VAGAS
    // ==================================================

    if (vaga) {

        vaga.innerHTML = '';


        if (
            candidato.candidaturas &&
            candidato.candidaturas.length > 0
        ) {

            candidato.candidaturas.forEach(
                function (candidatura, index) {

                    const bloco =
                        document.createElement('div');

                    bloco.style.marginBottom =
                        '12px';


                    const titulo =
                        candidatura.formulario?.titulo ||
                        'Vaga não informada';


                    const categoria =
                        candidatura.formulario?.categoria ||
                        '';


                    const pontuacao =
                        candidatura.pontuacao || 0;


                    const notaCorte =
                        candidatura.formulario?.notaCorte || 0;


                    const aprovado =
                        candidatura.aprovado;


                    bloco.innerHTML = `

                        <div>

                            <strong>
                                ${titulo}
                            </strong>

                            ${
                                categoria
                                    ? `<br>
                                       <small>
                                           ${categoria}
                                       </small>`
                                    : ''
                            }

                            <br>

                            <span>
                                Pontuação:
                                <strong>
                                    ${pontuacao} pts
                                </strong>
                            </span>

                            <br>

                            <span>
                                Nota de corte:
                                ${notaCorte} pts
                            </span>

                            <br>

                            <span style="
                                color: ${
                                    aprovado
                                        ? '#16a34a'
                                        : '#dc2626'
                                };
                                font-weight: 600;
                            ">

                                ${
                                    aprovado
                                        ? '✓ Aprovado'
                                        : '✕ Não aprovado'
                                }

                            </span>

                        </div>

                    `;


                    if (
                        index <
                        candidato.candidaturas.length - 1
                    ) {

                        bloco.style.borderBottom =
                            '1px solid #e2e8f0';

                        bloco.style.paddingBottom =
                            '10px';

                    }


                    vaga.appendChild(
                        bloco
                    );

                }
            );

        } else {

            // Compatibilidade com candidatos antigos

            vaga.textContent =
                candidato.formulario?.titulo ||
                'Não informado';

        }

    }


    // ==================================================
    // LINKEDIN
    // ==================================================

    if (linkedin) {

        linkedin.innerHTML = '';


        if (candidato.linkedin) {

            const link =
                document.createElement('a');

            link.href =
                candidato.linkedin;

            link.target =
                '_blank';

            link.rel =
                'noopener noreferrer';

            link.textContent =
                'Ver perfil ↗';

            linkedin.appendChild(link);

        } else {

            linkedin.textContent =
                'Não informado';

        }

    }


    // ==================================================
    // CONTAINER DAS RESPOSTAS
    // ==================================================

    const lista =
        document.getElementById(
            'modal-lista-perguntas'
        );


    if (!lista) {

        console.error(
            'ERRO: #modal-lista-perguntas não encontrado.'
        );

        return;
    }


    lista.innerHTML = '';


    // ==================================================
    // VERIFICA SE EXISTEM CANDIDATURAS
    // ==================================================

    if (
        candidato.candidaturas &&
        candidato.candidaturas.length > 0
    ) {

        let numeroResposta = 1;


        // ==================================================
        // PERCORRE CADA VAGA
        // ==================================================

        candidato.candidaturas.forEach(
            function (candidatura) {


                // ==========================================
                // CABEÇALHO DA VAGA
                // ==========================================

                const blocoVaga =
                    document.createElement('div');

                blocoVaga.className =
                    'modal-bloco-vaga';


                const tituloVaga =
                    candidatura.formulario?.titulo ||
                    'Vaga não informada';


                const pontuacao =
                    candidatura.pontuacao || 0;


                const notaCorte =
                    candidatura.formulario?.notaCorte || 0;


                const aprovado =
                    candidatura.aprovado;


                blocoVaga.innerHTML = `

                    <div style="
                        margin-top: 20px;
                        margin-bottom: 15px;
                        padding: 14px;
                        background: #f8fafc;
                        border-radius: 10px;
                        border-left: 4px solid #17375E;
                    ">

                        <strong style="
                            font-size: 16px;
                            color: #17375E;
                        ">

                            ${tituloVaga}

                        </strong>

                        <br>

                        <small>
                            ${candidatura.formulario?.categoria || ''}
                        </small>

                        <div style="
                            margin-top: 8px;
                        ">

                            <strong>
                                ${pontuacao} pts
                            </strong>

                            <span style="
                                margin-left: 10px;
                                color: #64748b;
                            ">

                                Corte:
                                ${notaCorte} pts

                            </span>

                            <span style="
                                margin-left: 10px;
                                color: ${
                                    aprovado
                                        ? '#16a34a'
                                        : '#dc2626'
                                };
                                font-weight: 600;
                            ">

                                ${
                                    aprovado
                                        ? '✓ Aprovado'
                                        : '✕ Não aprovado'
                                }

                            </span>

                        </div>

                    </div>

                `;


                lista.appendChild(
                    blocoVaga
                );


                // ==========================================
                // RESPOSTAS DESTA VAGA
                // ==========================================

                if (
                    !candidatura.respostas ||
                    candidatura.respostas.length === 0
                ) {

                    const semResposta =
                        document.createElement('p');

                    semResposta.className =
                        'sem-respostas';

                    semResposta.textContent =
                        'Esta candidatura não possui respostas.';

                    lista.appendChild(
                        semResposta
                    );

                    return;

                }


                candidatura.respostas.forEach(
                    function (resposta) {

                        const item =
                            document.createElement('div');

                        item.className =
                            'resposta-item';


                        const pergunta =
                            resposta.pergunta ||
                            'Pergunta não encontrada';


                        const respostaTexto =
                            resposta.resposta ||
                            'Resposta não informada';


                        const pontos =
                            resposta.pontos || 0;


                        item.innerHTML = `

                            <div class="resposta-numero">

                                ${numeroResposta}

                            </div>


                            <div class="resposta-conteudo">

                                <strong>

                                    ${pergunta}

                                </strong>


                                <p>

                                    ${respostaTexto}

                                </p>


                                <span>

                                    ${pontos} pts

                                </span>

                            </div>

                        `;


                        lista.appendChild(
                            item
                        );


                        numeroResposta++;

                    }
                );

            }
        );


    } else {

        // ==================================================
        // COMPATIBILIDADE COM DADOS ANTIGOS
        // ==================================================

        if (
            candidato.respostas &&
            candidato.respostas.length > 0
        ) {

            candidato.respostas.forEach(
                function (resposta, index) {

                    const item =
                        document.createElement('div');

                    item.className =
                        'resposta-item';

                    item.innerHTML = `

                        <div class="resposta-numero">

                            ${index + 1}

                        </div>

                        <div class="resposta-conteudo">

                            <strong>
                                ${resposta.pergunta}
                            </strong>

                            <p>
                                ${resposta.resposta}
                            </p>

                            <span>
                                ${resposta.pontos || 0} pts
                            </span>

                        </div>

                    `;

                    lista.appendChild(
                        item
                    );

                }
            );

        } else {

            lista.innerHTML = `

                <p class="sem-respostas">

                    Este candidato não possui respostas.

                </p>

            `;

        }

    }


    // ==================================================
    // ABRIR MODAL
    // ==================================================

    modal.classList.add('ativo');

    document.body.classList.add(
        'modal-aberto'
    );

    modal.style.display = 'flex';


    console.log(
        'Modal aberto com sucesso'
    );

}


// ======================================================
// GERAR PDF
// ======================================================

function gerarPdfCandidato() {

    const modal =
        document.getElementById(
            'modal-respostas'
        );


    if (!modal) {

        console.error(
            'Modal não encontrado.'
        );

        return;
    }


    const candidatoId =
        modal.dataset.candidatoId;


    if (!candidatoId) {

        alert(
            'Não foi possível identificar o candidato.'
        );

        return;
    }


    window.open(
        `/homeRh/candidato/${candidatoId}/pdf`,
        '_blank'
    );

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

    const modal =
        document.getElementById(
            'modal-respostas'
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        'ativo'
    );


    modal.style.display =
        'none';


    document.body.classList.remove(
        'modal-aberto'
    );

}


// ======================================================
// CLIQUE FORA
// ======================================================

window.addEventListener(
    'click',
    function (event) {

        const modal =
            document.getElementById(
                'modal-respostas'
            );


        if (
            modal &&
            event.target === modal
        ) {

            fecharModal();

        }

    }
);


// ======================================================
// ESC
// ======================================================

document.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key === 'Escape'
        ) {

            fecharModal();

        }

    }
);