import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/userSchema.js";
import {generateToken} from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

export const patientRegister = catchAsyncErrors(async (req, res, next) => {
    const {
        firstname,
        lastname,
        email,
        phone,
        password,
        gender,
        dob,
        aadhar,
        role
    } = req.body;

    if (
        !firstname ||
        !lastname ||
        !email || 
        !phone || 
        !password || 
        !gender || 
        !dob || 
        !aadhar ||
        !role
    ) {
        return next(new ErrorHandler("Please Fill Full Form!", 400));
    }

    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorHandler("User Already Registered!", 400));
    }

    user = await User.create({
        firstname,
        lastname, 
        email, 
        phone, 
        password, 
        gender, 
        dob, 
        aadhar,
        role,
    });
    generateToken(user, "user Registered!", 200, res);
});


export const login = catchAsyncErrors(async(req,res,next)=>{
    const {email, password, confirmPassword, role} = req.body;
    if( !email || !password || !confirmPassword || !role) {
        return next(new ErrorHandler("Please Provide All Details!", 400));
    }
    if(password !== confirmPassword){
        return next(new ErrorHandler("Password And Confirm Password Do Not Match!", 400));
    }
    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid Password Or Email!", 400));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Password Or Email!", 400));
    }
    if(role !== user.role){
        return next(new ErrorHandler("User With This Role Not Found!", 400));
    }
    generateToken(user, "user Login Successfully!", 200, res);
});

export const addNewAdmin = catchAsyncErrors(async(req,res,next)=>{
    const {
        firstname,
        lastname,
        email,
        phone,
        password,
        gender,
        dob,
        aadhar
    } = req.body;
    if (
        !firstname ||
        !lastname ||
        !email || 
        !phone || 
        !password || 
        !gender || 
        !dob || 
        !aadhar
    ) {
        return next(new ErrorHandler("Please Fill Full Form!", 400));
    }
    const isRegistered = await User.findOne({email});
    if (isRegistered){
        return next(new ErrorHandler(`${isRegistered.role} With This Email Already Exists!`));
    }
    const admin = await User.create({
        firstname,
        lastname,
        email,
        phone,
        password,
        gender,
        dob,
        aadhar,
        role: "Admin",
    });
    res.status(200).json({
        success: true,
        message: "New Admin Registered!",
    });
});

export const getAllDoctors = catchAsyncErrors(async(req,res,next)=>{
    const doctors = await User.find({role: "Doctor"});
    res.status(200).json({
        success: true,
        doctors,
    });
});

export const getUserDetails = catchAsyncErrors(async(req,res,next)=>{
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});

export const logoutAdmin = catchAsyncErrors(async(req,res,next)=>{
    res.status(200)
    .cookie("adminToken", "", {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: true,
        sameSite: "None"
    })
    .json({
        success: true,
        message: "Admin Logged Out Successfully!",
    });
});

export const logoutPatient = catchAsyncErrors(async(req,res,next)=>{
    res.status(200)
    .cookie("patientToken", "", {
        httpOnly: true,
        expires: new Date(Date.now()),
        sameSite: "None",
        secure: true,
    })
    .json({
        success: true,
        message: "Patient Logged Out Successfully!",
    });
});

// Cloudinary configuration
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Doctor Avatar Required!", 400));
    }

    const { docAvatar } = req.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(docAvatar.mimetype)) {
        return next(new ErrorHandler("File Format Not Supported!", 400));
    }

    const {
        firstname,
        lastname,
        email,
        phone,
        password,
        gender,
        dob,
        aadhar,
        doctorDepartment,
    } = req.body;

    if (!firstname ||
        !lastname ||
        !email ||
        !phone ||
        !password ||
        !gender ||
        !dob ||
        !aadhar ||
        !doctorDepartment
    ) {
        return next(new ErrorHandler("Please Provide Full Details!", 400));
    }

    const isRegistered = await User.findOne({ email });
    if (isRegistered) {
        return next(new ErrorHandler(`${isRegistered.role} already registered with this email!`, 400));
    }

    const cloudinaryResponse = await cloudinary.v2.uploader.upload(docAvatar.tempFilePath);
    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error(
            "Cloudinary Error:", cloudinaryResponse.error || "Unknown Cloudinary Error"
        );
        return next(new ErrorHandler("Failed to upload avatar", 500));
    }

    const doctor = await User.create({
        firstname,
        lastname,
        email,
        phone,
        password,
        gender,
        dob,
        aadhar,
        doctorDepartment,
        role: "Doctor",
        docAvatar: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
    });

    res.status(200).json({
        success: true,
        message: "New Doctor Registered!",
        doctor
    });
});