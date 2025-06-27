// Espera a que DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const integralForm = document.getElementById('integralForm');
    const resultado = document.getElementById('resultado');

    integralForm.addEventListener('submit', function(e) {
        e.preventDefault();
        resultado.innerHTML = "";
        const funcion = document.getElementById('funcion').value.trim();
        const variable = document.getElementById('variable').value.trim() || 'x';

        if(!funcion) {
            mostrarError("Por favor, introduce una función.");
            return;
        }

        try {
            // Prueba que la función sea válida matemáticamente
            math.parse(funcion);
        } catch {
            mostrarError("Función inválida. Verifica la sintaxis.");
            return;
        }

        let integralLatex = '';
        let integralTexto = '';
        let integralComputada = null;
        try {
            // Usar nerdamer para integrar de forma simbólica
            const symbolic = nerdamer(`integrate(${funcion},${variable})`);
            integralTexto = symbolic.text();
            integralLatex = symbolic.toTeX() + "+C";
            integralComputada = symbolic.toString();
        } catch {
            mostrarError("No se pudo calcular la integral simbólicamente. Intenta otra función.");
            return;
        }

        // Render resultado bonito
        resultado.innerHTML = `
        <div class="alert alert-success">
            <strong>Solución simbólica:</strong>
            <div class="my-2 text-center" id="latex-render">
               \\[
                  \\int ${math.parse(funcion).toTex({parenthesis:'keep', implicit:'hide'})} \\, d${variable} = ${integralLatex}
               \\]
            </div>
            <div class="small text-muted">También en texto: <code>${integralTexto} + C</code></div>
        </div>
        `;

        if(window.MathJax) MathJax.typesetPromise();
    });

    function mostrarError(msg) {
        resultado.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
    }
});
