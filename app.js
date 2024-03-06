
const cors = require('cors')
const express = require('express');
const bodyParser = require('body-parser');
const Timesheet = require('./models/timesheet');
const { Sequelize } = require('sequelize');

//import libraries for uploading file
const multer = require('multer');
//const mysql = require('mysql');
const xlsx = require('xlsx');








const app = express();
app.use(cors());


//getting index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());



// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' });










// Connect to the database
const sequelize = new Sequelize('mytime', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
});



// Sync the model with the database
Timesheet.sync();






// Middleware to serve static files from 'public' directory
app.use(express.static('public'));





// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Parse Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Insert data into MySQL database using Sequelize
    try {
        for (const row of data.slice(1)) {
            await Timesheet.create({
                fullName: row[0],
                workMode: row[1],
                officeLocation: row[2],
                hoursOfWork: row[3],
            });
        }
        res.send('File uploaded and data inserted into database successfully');
    } catch (err) {
        console.error('Error inserting data into database:', err);
        res.status(500).send('Error inserting data into database');
    }
});






//Routes

// Create a new timesheet entry
app.post('/api/create-timesheets', async (req, res) => {
    try {
      const { fullName, workMode, officeLocation, hoursOfWork } = req.body;
      const newTimesheetEntry = await Timesheet.create({
        fullName,
        workMode,
        officeLocation,
        hoursOfWork,
      });
  
      res.json(newTimesheetEntry);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Fetch all timesheet entries
app.get('/api/get-timesheets', async (req, res) => {
    try {
        const timesheets = await Timesheet.findAll();
        res.json(timesheets);
    } catch (error) {
        console.error('Error fetching time sheet entries:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Fetch a specific timesheet entry by ID
app.get('/api/get-timesheets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const timesheet = await Timesheet.findByPk(id);
        if (!timesheet) {
            return res.status(404).json({ error: 'Time sheet entry not found' });
        }
        res.json(timesheet);
    } catch (error) {
        console.error('Error fetching time sheet entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Update a timesheet entry
app.put('/api/update-timesheet/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, workMode, officeLocation, hoursOfWork } = req.body;
        await Timesheet.update({
            fullName,
            workMode,
            officeLocation,
            hoursOfWork,
        }, {
            where: { id },
        });
        res.json({ message: 'Timesheet entry updated successfully' });
        //res.redirect('/');
    } catch (error) {
        console.error('Error updating time sheet entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a timesheet entry
app.delete('/api/delete-timesheets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Timesheet.destroy({ where: { id } });
        res.json({ message: 'Timesheet entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting time sheet entry:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

    
});





app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


