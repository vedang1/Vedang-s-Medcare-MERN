import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

export const postAppointment = catchAsyncErrors(async(req,res,next) => {
    const {
        firstname,
        lastname,
        email,
        phone,
        aadhar,
        dob,
        gender,
        appointment_date,
        department,
        doctor_firstname,
        doctor_lastname,
        hasVisited,
        address,
    } = req.body;

    if(
     !firstname ||
     !lastname ||
     !email ||
     !phone ||
     !aadhar ||
     !dob ||
     !gender || 
     !appointment_date ||
     !department ||
     !doctor_firstname ||
     !doctor_lastname ||
     !address 
    ) {
        return next(new ErrorHandler("Please Fill Full Form!", 400));
    }
    const isConflict = await User.find({
        firstname: doctor_firstname,
        lastname: doctor_lastname,
        role: "Doctor",
        doctorDepartment: department
    });
    if(isConflict.length === 0){
        return next(new ErrorHandler("Doctor not found!", 400));
    }
    if(isConflict.length > 1){
        return next(new ErrorHandler("Doctors Conflict! Please Contact Through Email or Phone!", 400));
    }
    const doctorId = isConflict[0]._id;
    const patientId = req.user._id;
    const appointment = await Appointment.create({
        firstname,
        lastname,
        email,
        phone,
        aadhar,
        dob,
        gender,
        appointment_date,
        department,
        doctor:{
            firstname: doctor_firstname,
            lastname: doctor_lastname,
        },
        hasVisited,
        address,
        doctorId,
        patientId,
    });
    res.status(200).json({
        success: true,
        message: "Appointment Sent Successfully!",
        appointment,
    });
});

export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
    const appointments = await Appointment.find();
    res.status(200).json({
        success: true,
        appointments,
    });
});

export const updateAppointmentStatus = catchAsyncErrors(async(req, res, next)=>{
    const {id} = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment Not Found!", 404));
    }
    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
        message: "Appointment Status Updated!",
        appointment,
    });
});

export const deleteAppointment = catchAsyncErrors(async(req,res,next)=>{
    const {id} = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment Not Found!", 404));
    }
    await appointment.deleteOne();
    res.status(200).json({
        success: true,
        message: "Appointment Deleted!",
    });
});

