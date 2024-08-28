// config/controller/messageController.js
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import { Message } from "../models/messageSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";

export const sendMessage = catchAsyncErrors(async (req, res, next) => {
    const { firstname, lastname, email, phone, message } = req.body;
    if (!firstname || !lastname || !email || !phone || !message) {
        return next(new ErrorHandler("Please Fill Full Form!", 400));
    }
    await Message.create({ firstname, lastname, email, phone, message });
    res.status(200).json({
        success: true,
        message: "Message Sent Successfully",
    });
});

export const getAllMessages = catchAsyncErrors(async (req, res, next) => {
    try {
        const messages = await Message.find(); // Fetch all messages from the database
        res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        return next(new ErrorHandler("Failed to fetch messages", 400)); // Handle any errors that occur
    }
});

