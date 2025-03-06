const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const appointmentsFile = 'appointments.json';

// Inicializace souboru s rezervacemi
if (!fs.existsSync(appointmentsFile)) {
    fs.writeFileSync(appointmentsFile, '[]');
}

// Základní routa pro kořenovou cestu
app.get('/', (req, res) => {
    res.send('Backend veterinární stanice funguje!');
});

// Routa pro získání rezervací
app.get('/appointments', (req, res) => {
    const date = req.query.date;
    const doctor = req.query.doctor;

    fs.readFile(appointmentsFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Chyba při načítání rezervací');
        }

        let appointments = JSON.parse(data);

        // Filtrace podle data a doktora
        if (date) {
            appointments = appointments.filter(app => app.date === date);
        }
        if (doctor) {
            appointments = appointments.filter(app => app.doctor === doctor);
        }

        res.json(appointments);
    });
});

// Routa pro přidání rezervace
app.post('/appointments', (req, res) => {
    const newAppointment = req.body;

    // Validace vstupů
    if (!newAppointment.date || !newAppointment.time || !newAppointment.duration || !newAppointment.client || !newAppointment.doctor) {
        return res.status(400).send('Chybějící datum, čas, délka, jméno klienta nebo doktor');
    }

    fs.readFile(appointmentsFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Chyba při načítání rezervací');
        }

        const appointments = JSON.parse(data);

        // Kontrola dostupnosti časového slotu
        const newStart = new Date(`${newAppointment.date}T${newAppointment.time}:00`);
        const newEnd = new Date(newStart.getTime() + newAppointment.duration * 60000);

        const isSlotAvailable = appointments.every(app => {
            const appStart = new Date(`${app.date}T${app.time}:00`);
            const appEnd = new Date(appStart.getTime() + app.duration * 60000);

            return newEnd <= appStart || newStart >= appEnd;
        });

        if (!isSlotAvailable) {
            return res.status(400).send('Časový slot je již obsazen');
        }

        appointments.push(newAppointment);
        fs.writeFile(appointmentsFile, JSON.stringify(appointments), (err) => {
            if (err) {
                return res.status(500).send('Chyba při ukládání rezervací');
            }
            res.send('Rezervace proběhla úspěšně');
        });
    });
});

app.listen(port, () => {
    console.log(`Server běží na portu ${port}`);
});