// =========================================================================
// PROJETO: Monitoramento de Umidade do Solo em Volts + Filtro Anti-Ruido
// INSTITUIÇÃO: EEB Marechal Luz - Jaguaruna / SC (Laboratório Maker)
// RESPONSÁVEL: Prof. Sandro José Clara - Especialista em Informática
// =========================================================================

let limiteSecoVolts = 1.29    // Abaixo disso: FALTA DE AGUA
let limiteExcessoVolts = 3.31 // Evita falso alarme em 3.30V normal

let tensaoVolts = 0
let statusTexto = ""
let ultimoLogExcel = -10000

music.setVolume(255)
datalogger.setColumns(["Projeto", "Orientador", "Tensao_V", "Min_V", "Max_V", "Status"])

// Função de leitura filtrada (cancela interferência de 60Hz quando o prego sai da terra)
function lerTensaoFiltrada(): number {
    // Ativa pull-down interno para não deixar o pino P1 flutuando no ar
    pins.setPull(DigitalPin.P1, PinPullMode.PullDown)
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(20)

    let somaADC = 0
    // Faz 10 leituras rápidas (elimina picos de ruído eletromagnético)
    for (let i = 0; i < 10; i++) {
        somaADC += pins.analogReadPin(AnalogPin.P1)
        basic.pause(5)
    }

    pins.digitalWritePin(DigitalPin.P0, 0)
    let mediaADC = somaADC / 10
    return Math.round((mediaADC * 3.3 / 1023) * 100) / 100
}

basic.forever(function () {
    // 1. Faz a leitura estabilizada
    tensaoVolts = lerTensaoFiltrada()
    let agora = input.runningTime()
    let tempoDecorrido = Math.round(agora / 1000)

    // 2. Atualiza os gráficos no notebook
    serial.writeValue("Tensao_V.Medida", tensaoVolts)
    serial.writeValue("Tensao_V.Min_1_29V", limiteSecoVolts)
    serial.writeValue("Tensao_V.Max_3_30V", limiteExcessoVolts)
    serial.writeValue("Cronometro.Segundos", tempoDecorrido)

    // 3. Classifica o estado do solo
    if (tensaoVolts < limiteSecoVolts) {
        statusTexto = "FALTA DE AGUA"
        basic.showIcon(IconNames.Umbrella)

        serial.writeLine("====================================================================")
        serial.writeLine("  [!!! ALERTA: FALTA DE AGUA !!!] -> SOLO SECO (" + tensaoVolts + "V < " + limiteSecoVolts + "V)")
        serial.writeLine("  PROJETO MAKER IoT | EEB Marechal Luz | Prof. Sandro Jose Clara")
        serial.writeLine("====================================================================")

        for (let i = 0; i < 4; i++) {
            music.playTone(988, 100)
            basic.pause(50)
            music.playTone(1319, 100)
            basic.pause(50)
        }
    } else if (tensaoVolts > limiteExcessoVolts) {
        statusTexto = "EXCESSO DE AGUA"
        basic.showIcon(IconNames.Sad)

        serial.writeLine("====================================================================")
        serial.writeLine("  [*** ALERTA: EXCESSO DE AGUA ***] -> ENCHARCADO (" + tensaoVolts + "V)")
        serial.writeLine("  PROJETO MAKER IoT | EEB Marechal Luz | Prof. Sandro Jose Clara")
        serial.writeLine("====================================================================")

        music.playTone(330, 250)
        basic.pause(100)
        music.playTone(262, 350)
    } else {
        statusTexto = "UMIDADE IDEAL"
        basic.showIcon(IconNames.Happy)

        serial.writeLine("PROJETO MAKER IoT | EEB Marechal Luz - Jaguaruna/SC | Prof. Sandro Jose Clara")
        serial.writeLine("STATUS: UMIDADE IDEAL (" + tensaoVolts + "V) | Tempo: " + tempoDecorrido + "s")
    }

    // 4. Grava no Data Logger / Excel a cada 10 segundos
    if (agora - ultimoLogExcel >= 10000) {
        ultimoLogExcel = agora
        datalogger.log(
            datalogger.createCV("Projeto", "EEB Marechal Luz"),
            datalogger.createCV("Orientador", "Prof. Sandro Jose Clara"),
            datalogger.createCV("Tensao_V", tensaoVolts),
            datalogger.createCV("Min_V", limiteSecoVolts),
            datalogger.createCV("Max_V", limiteExcessoVolts),
            datalogger.createCV("Status", statusTexto)
        )
    }

    basic.pause(1500)
})

// Botão A: Mostra a tensão atual em Volts nos LEDs
input.onButtonPressed(Button.A, function () {
    basic.showNumber(lerTensaoFiltrada())
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