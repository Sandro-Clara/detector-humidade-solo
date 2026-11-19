// =========================================================================
// PROJETO: Monitoramento de Umidade do Solo em Volts + Alarme Sonoro (IoT)
// INSTITUIÇÃO: EEB Marechal Luz - Jaguaruna / SC (Laboratório Maker)
// RESPONSÁVEL: Prof. Sandro José Clara - Especialista em Informática
// =========================================================================

let limiteVolts = 1.29 // Ponto de corte em Volts (equivale a ~400 na escala 0-1023)
let leituraADC = 0
let tensaoVolts = 0
let statusTexto = ""
let alertaVolts = 0 // 0V = Normal | 3.30V = Alerta visual no gráfico
let ultimoLogExcel = -10000 // Controle de gravação no Data Logger (a cada 10s)

// Volume no MÁXIMO (255) para maior destaque sonoro
music.setVolume(255)
datalogger.setColumns(["Projeto", "Orientador", "Tensao_V", "Limite_V", "Status"])

basic.forever(function () {
    // 1. Leitura rápida a cada ciclo (resposta imediata ao retirar o prego)
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(50)
    leituraADC = pins.analogReadPin(AnalogPin.P1)
    pins.digitalWritePin(DigitalPin.P0, 0)

    // 2. Converte para Volts (0.00V a 3.30V)
    tensaoVolts = Math.round((leituraADC * 3.3 / 1023) * 100) / 100
    let agora = input.runningTime()
    let tempoDecorrido = Math.round(agora / 1000)

    // 3. Atualiza os gráficos no notebook
    serial.writeValue("Tensao_V.Medida", tensaoVolts)
    serial.writeValue("Tensao_V.Limite_1_29V", limiteVolts)
    serial.writeValue("Tensao_V.Alerta_3_3V", alertaVolts)
    serial.writeValue("Cronometro.Segundos", tempoDecorrido)

    // 4. Verifica o estado do solo e mantém o status SEMPRE visível no console
    if (tensaoVolts < limiteVolts) {
        statusTexto = "PRECISA DE AGUA"
        alertaVolts = 3.30
        basic.showIcon(IconNames.Umbrella)

        // Banner de alerta permanente enquanto estiver seco
        serial.writeLine("====================================================================")
        serial.writeLine("  [!!! ALERTA DE IRRIGACAO !!!] -> SOLO SECO (" + tensaoVolts + "V < " + limiteVolts + "V)")
        serial.writeLine("  PROJETO MAKER IoT | EEB Marechal Luz | Prof. Sandro Jose Clara")
        serial.writeLine("====================================================================")

        // SIRENE DE ALERTA FORTE (4 toques rápidos no volume máximo a cada ciclo)
        for (let i = 0; i < 4; i++) {
            music.playTone(988, 100) // Nota Si5 aguda (bem audível)
            basic.pause(50)
            music.playTone(1319, 100) // Nota Mi6 bem aguda
            basic.pause(50)
        }
    } else {
        statusTexto = "TERRA UMIDA"
        alertaVolts = 0
        basic.showIcon(IconNames.Happy)

        // Mantém a identificação e o status TERRA UMIDA fixos no console a cada leitura
        serial.writeLine("PROJETO MAKER IoT | EEB Marechal Luz - Jaguaruna/SC | Prof. Sandro Jose Clara")
        serial.writeLine("STATUS: TERRA UMIDA (" + tensaoVolts + "V) | Tempo: " + tempoDecorrido + "s")
    }

    // 5. Grava na memória interna do micro:bit V2 (Data Logger / Excel) a cada 10 segundos
    if (agora - ultimoLogExcel >= 10000) {
        ultimoLogExcel = agora
        datalogger.log(
            datalogger.createCV("Projeto", "EEB Marechal Luz"),
            datalogger.createCV("Orientador", "Prof. Sandro Jose Clara"),
            datalogger.createCV("Tensao_V", tensaoVolts),
            datalogger.createCV("Limite_V", limiteVolts),
            datalogger.createCV("Status", statusTexto)
        )
    }

    basic.pause(1500) // Ciclo de 1,5 segundo: leitura ágil e leitura confortável na tela
})

// Botão A: Mostra a tensão atual em Volts nos LEDs
input.onButtonPressed(Button.A, function () {
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(50)
    let adcAtual = pins.analogReadPin(AnalogPin.P1)
    pins.digitalWritePin(DigitalPin.P0, 0)

    let voltsAtual = Math.round((adcAtual * 3.3 / 1023) * 100) / 100
    basic.showNumber(voltsAtual)
})

// Botão B: Exibe a identificação institucional e autoral nos LEDs
input.onButtonPressed(Button.B, function () {
    basic.showString("EEB Marechal Luz - Prof. Sandro")
})

// Botões A + B juntos: Limpa a memória interna para iniciar novo experimento
input.onButtonPressed(Button.AB, function () {
    datalogger.deleteLog(datalogger.DeleteType.Full)
    basic.showIcon(IconNames.Yes)
})