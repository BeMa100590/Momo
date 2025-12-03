// --- Konfiguration ---
const CHANNEL_ID = '3191042';
const API_KEY = 'ML39UPRHQ63K7NNK'; // Dein Read API Key ist NICHT nötig, da der Kanal öffentlich ist.
                                    // Aber wir nutzen ihn für die Konsistenz, falls der Kanal privat wird.
const DAYS_TO_FETCH = 7;
// Tagsüber: 8 Uhr bis 20 Uhr (20:00)
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
// ---------------------

// URL zum Abruf der letzten Messung (Live-Wert)
const LIVE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json`;

// URL zum Abruf der historischen Daten (letzte 7 Tage)
// field1=Temperatur, field2=Luftfeuchte
const HISTORY_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?days=${DAYS_TO_FETCH}&results=8000&timezone=Europe/Berlin`;


// Hauptfunktion zum Abrufen und Anzeigen der Daten
async function updateDashboard() {
    document.getElementById('last-updated').textContent = 'Aktualisiere Daten...';
    
    // 1. LIVE-DATEN ABRUFEN
    try {
        const liveResponse = await fetch(LIVE_URL);
        const liveData = await liveResponse.json();

        const tempLive = parseFloat(liveData.field1);
        const humLive = parseFloat(liveData.field2);

        document.getElementById('temp-live').textContent = `${tempLive.toFixed(1)} °C`;
        document.getElementById('hum-live').textContent = `${humLive.toFixed(1)} %`;
        
    } catch (error) {
        console.error('Fehler beim Abrufen der Live-Daten:', error);
        document.getElementById('temp-live').textContent = 'FEHLER';
        document.getElementById('hum-live').textContent = 'FEHLER';
    }


    // 2. HISTORISCHE DATEN ABRUFEN UND VERARBEITEN
    try {
        const historyResponse = await fetch(HISTORY_URL);
        const historyData = await historyResponse.json();
        
        // Array für Tag- und Nachtdaten
        const dayData = [];
        const nightData = [];

        historyData.feeds.forEach(feed => {
            const timestamp = new Date(feed.created_at);
            const hour = timestamp.getHours();
            const temp = parseFloat(feed.field1);
            const hum = parseFloat(feed.field2);
            
            // Nur gültige Datenpunkte verarbeiten
            if (!isNaN(temp) && !isNaN(hum)) {
                // Unterscheidung Tag (8:00 - 19:59) / Nacht
                if (hour >= DAY_START_HOUR && hour < DAY_END_HOUR) {
                    dayData.push({ temp, hum });
                } else {
                    nightData.push({ temp, hum });
                }
            }
        });

        // 3. DURCHSCHNITTE BERECHNEN
        
        function calculateAverage(data) {
            if (data.length === 0) return { avgTemp: NaN, avgHum: NaN };
            
            const totalTemp = data.reduce((sum, item) => sum + item.temp, 0);
            const totalHum = data.reduce((sum, item) => sum + item.hum, 0);
            
            return {
                avgTemp: totalTemp / data.length,
                avgHum: totalHum / data.length
            };
        }

        const dayAvg = calculateAverage(dayData);
        const nightAvg = calculateAverage(nightData);
        
        // 4. ERGEBNISSE ANZEIGEN
        
        const formatValue = (value) => isNaN(value) ? 'N/A' : value.toFixed(1);

        document.getElementById('temp-day-avg').textContent = `${formatValue(dayAvg.avgTemp)} °C`;
        document.getElementById('hum-day-avg').textContent = `${formatValue(dayAvg.avgHum)} %`;

        document.getElementById('temp-night-avg').textContent = `${formatValue(nightAvg.avgTemp)} °C`;
        document.getElementById('hum-night-avg').textContent = `${formatValue(nightAvg.avgHum)} %`;

    } catch (error) {
        console.error('Fehler beim Abrufen/Verarbeiten der historischen Daten:', error);
        // Anzeigen von Fehlern in der Tabelle
        document.getElementById('temp-day-avg').textContent = 'FEHLER';
        document.getElementById('hum-day-avg').textContent = 'FEHLER';
        document.getElementById('temp-night-avg').textContent = 'FEHLER';
        document.getElementById('hum-night-avg').textContent = 'FEHLER';
    }
    
    // Letztes Update
    document.getElementById('last-updated').textContent = `Zuletzt aktualisiert: ${new Date().toLocaleTimeString('de-DE')}`;
}

// Update beim Laden der Seite
updateDashboard();

// Regelmäßiges Update alle 60 Sekunden
setInterval(updateDashboard, 60000); // 60.000 Millisekunden = 1 Minute
