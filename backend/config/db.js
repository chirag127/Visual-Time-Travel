/**
 * Database configuration module
 * Handles MongoDB connection setup
 * @module config/db
 */

const mongoose = require("mongoose");
const env = require("./env");

/**
 * Connect to MongoDB
 * @returns {Promise<void>} A promise that resolves when connected
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            // These options are no longer needed in Mongoose 6+, but kept for compatibility
            // with older versions if needed
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true,
            // useFindAndModify: false,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Set up connection error handler
        mongoose.connection.on("error", (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        // Set up disconnection handler
        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected. Attempting to reconnect...");
        });

        // Handle process termination
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed due to app termination");
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };
