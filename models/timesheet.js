const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('mytime', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
});

const Timesheet = sequelize.define('timesheets', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    workMode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    officeLocation: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hoursOfWork: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
});

module.exports = Timesheet;


