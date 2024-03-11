
   const path = require('path')
const cors = require('cors')
const express = require('express');
const bodyParser = require('body-parser');
const Timesheet = require('./models/timesheet');
const { Sequelize } = require('sequelize');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');


const app = express();
app.use(cors());


//getting index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());



// Function to read and update the upload counter like image1 , image2 etc.
function getNextImageName() {
    const counterPath = path.join(__dirname, 'uploadCounter.json');
    const counterData = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
    const nextImageName = `image${counterData.counter}.jpg`;
    counterData.counter++;
    fs.writeFileSync(counterPath, JSON.stringify(counterData), 'utf8');
    return nextImageName;
   }
   
   // Configure Multer for file upload
   const storage = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
       if (file.mimetype.startsWith('image/')) {
         const nextImageName = getNextImageName();
         cb(null, nextImageName);
       } else {
         cb(null, file.originalname);
       }
    }
   });
   const upload = multer({ storage: storage });









// Connect to the database
const sequelize = new Sequelize('mytime', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
});



// Sync the model with the database
Timesheet.sync();






// Middleware to serve static files from 'public' directory
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
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
    } else if (req.file.mimetype.startsWith('image/')) {
        
        res.send({ filePath: '/uploads/' + req.file.filename }); // Adjust the path as necessary
    } else {
        return res.status(400).send('Invalid file type');
    }
});


// Route to fetch  list of images 
app.get('/api/list-uploads', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).send('Error reading uploads directory');
        }
        // Filter out any non-image files if necessary
        const imagesList = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'));
        res.json(imagesList.map(file => ({ timesheet: file, action: 'View' })));
    });
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
        // const timesheets = await Timesheet.findAll();
        const timesheets = await Timesheet.findAll({
            logging:console.log,
           
            order: [['id','DESC']]
              
        })  
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

