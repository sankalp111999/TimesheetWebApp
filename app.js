const path = require('path');
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
// Configure Multer to dynamically set the destination based on the file type
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Check if the file is an image
        if (file.mimetype.startsWith('image/')) {
            // Set the destination to 'uploads/images'
            cb(null, 'uploads/images/');
        } else {
            // For other file types, set the destination to 'uploads'
            cb(null, 'uploads/');
        }
    },
    filename: function (req, file, cb) {
        // Use the original file name
        cb(null, file.originalname);
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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));


// Set EJS as the view engine
app.set('view engine', 'ejs');


// Configure Multer for image uploads
//const uploadImages = multer({ dest: 'uploads/images/' });

// Serve uploaded images
//app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

/* Route to handle image uploads
app.post('/upload-image', uploadImages.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    // You can save the image path in the database here if needed
    res.send('Image uploaded successfully');
});

*/





// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Handle .xlsx file
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
        // Handle image file
        // For example, save the image path in the database
        res.redirect(`/view-image?imagePath=/uploads/images/${req.file.filename}`);
    } else {
        return res.status(400).send('Invalid file type');
    }
});



app.get('/view-image', (req, res) => {
    const imagePath = req.query.imagePath;
    res.render('view-image', { imagePath });
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


