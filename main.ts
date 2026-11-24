/**
 * =========================================================================
 * 
 * PROJETO 3.0 : Monitoramento de Umidade do Solo em Volts  (limite 3,3v)  
 * 
 * INSTITUIÇÃO: EEB Marechal Luz - Jaguaruna / SC (Laboratório Maker)
 * 
 * RESPONSÁVEL: Prof. Sandro J. Clara - Especialista em Informática
 * 
 * =========================================================================
 */
// Botão A: Mostra a tensão atual em Volts nos LEDs
input.onButtonPressed(Button.A, function () {
    basic.showNumber(lerTensaoFiltrada())
})
// Função de leitura filtrada com variáveis locais isoladas
function lerTensaoFiltrada () {
    pins.digitalWritePin(DigitalPin.P0, 1)
    basic.pause(20)
    // Faz 10 leituras rápidas (elimina picos de ruído de 60Hz)
    for (let index = 0; index < 10; index++) {
        somaADC += pins.analogReadPin(AnalogPin.P1)
        basic.pause(5)
    }
    pins.digitalWritePin(DigitalPin.P0, 0)
    mediaADC = somaADC / 10
    return Math.round(mediaADC * 3.3 / 1023 * 100) / 100
}
// Botões A + B juntos: Limpa a memória interna (Data Logger)
input.onButtonPressed(Button.AB, function () {
    datalogger.deleteLog(datalogger.DeleteType.Full)
    basic.showIcon(IconNames.Yes)
    basic.pause(500)
})
// Botão B: Exibe a identificação institucional e autoral nos LEDs
input.onButtonPressed(Button.B, function () {
    basic.showString("EEB Marechal Luz - Prof. Sandro")
})
let statusTexto = ""
let tempoDecorrido = 0
let agora = 0
let tensaoVolts = 0
let mediaADC = 0
let somaADC = 0
let limiteSecoVolts = 1.29
// Ajustado de 3.31 para 3.19V para que o alerta de excesso realmente dispare
let limiteExcessoVolts = 3.19
let ultimoLogExcel = -10000
music.setVolume(255)
datalogger.setColumns([
"Projeto",
"Orientador",
"Tensao_V",
"Min_V",
"Max_V",
"Status"
])
basic.forever(function () {
    // 1. Faz a leitura estabilizada
    tensaoVolts = lerTensaoFiltrada()
    agora = input.runningTime()
    tempoDecorrido = Math.round(agora / 1000)
    // 2. Atualiza os gráficos no notebook
    serial.writeValue("Tensao_V.Medida", tensaoVolts)
    serial.writeValue("Tensao_V.Min_1_29V", limiteSecoVolts)
    serial.writeValue("Tensao_V.Max_2_85V", limiteExcessoVolts)
    serial.writeValue("Cronometro.Segundos", tempoDecorrido)
    // 3. Classifica o estado do solo
    if (tensaoVolts < limiteSecoVolts) {
        statusTexto = "FALTA DE AGUA"
        basic.showIcon(IconNames.Umbrella)
        serial.writeLine("====================================================================")
        serial.writeLine("  [!!! ALERTA: FALTA DE AGUA !!!] -> SOLO SECO (" + tensaoVolts + "V < " + limiteSecoVolts + "V)")
        serial.writeLine("  PROJETO MAKER IoT | EEB Marechal Luz | Prof. Sandro Jose Clara")
        serial.writeLine("====================================================================")
        for (let index = 0; index < 4; index++) {
            music.playTone(988, 100)
            basic.pause(50)
            music.playTone(1319, 100)
            basic.pause(50)
        }
    } else if (tensaoVolts > limiteExcessoVolts) {
        statusTexto = "EXCESSO DE AGUA"
        basic.showIcon(IconNames.Sad)
        serial.writeLine("====================================================================")
        serial.writeLine("  [*** ALERTA: EXCESSO DE AGUA ***] -> ENCHARCADO (" + tensaoVolts + "V > " + limiteExcessoVolts + "V)")
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
