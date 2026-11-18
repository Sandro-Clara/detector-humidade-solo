// =========================================================================
// PROJETO: Monitoramento de Umidade do Solo (Projeto Maker IoT na Escola)
// INSTITUIÇÃO: EEB Marechal Luz - Jaguaruna / SC (Laboratório Maker)
// RESPONSÁVEL: Prof. Sandro José Clara - Especialista em Informática
// =========================================================================

let limiteSeco = 400 // Ajuste este valor após calibrar com a terra seca e molhada
let leituraUmidade = 0

basic.forever(function () {
    // 1. Liga a alimentação do sensor apenas no momento da leitura (evita oxidação)
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(100)

    // 2. Faz a leitura analógica no pino P1
    leituraUmidade = pins.analogReadPin(AnalogPin.P1)

    // 3. Desliga a alimentação imediatamente
    pins.digitalWritePin(DigitalPin.P0, 0)

    // 4. Exibe a identificação autoral e institucional continuamente no painel
    serial.writeLine("----------------------------------------------------")
    serial.writeLine("PROJETO MAKER IoT | EEB Marechal Luz - Jaguaruna/SC")
    serial.writeLine("ORIENTADOR: Prof. Sandro Jose Clara (Esp. Informatica)")

    // 5. Envia os dados para o gráfico e o status logo abaixo dos créditos
    serial.writeValue("Umidade", leituraUmidade)
    serial.writeValue("Limite", limiteSeco)

    if (leituraUmidade < limiteSeco) {
        basic.showIcon(IconNames.Umbrella)
        serial.writeLine("STATUS: PRECISA DE AGUA")
    } else {
        basic.showIcon(IconNames.Happy)
        serial.writeLine("STATUS: TERRA UMIDA")
    }

    basic.pause(2000)
})

// Botão A: Exibe o valor numérico na matriz de LEDs para calibração rápida
input.onButtonPressed(Button.A, function () {
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(100)
    let valorAtual = pins.analogReadPin(AnalogPin.P1)
    pins.digitalWritePin(DigitalPin.P0, 0)

    basic.showNumber(valorAtual)
})

// Botão B: Rola o nome do projeto e orientador na própria matriz de LEDs do micro:bit
input.onButtonPressed(Button.B, function () {
    basic.showString("Prof. Sandro")
})