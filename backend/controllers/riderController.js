const bcrypt = require("bcryptjs");
const Rider = require("../models/RiderModel"); // Adjust path as needed
const Role = require("../models/roleModel");
const RiderAccount=require("../models/RiderAccount")
const Store=require("../models/storeModel")
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function generateTransactionCode() {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  return `TR${year}${randomPart}`;
}


exports.createRider = async (req, res) => {
    try {
        const {
            username, firstname, lastname, mobile, email, role,
            password, store, status, bankAccountNumber, ifscCode,
            bankName, addharCardNumber, panCardNumber, drivingLicenseNumber,
            riderAccountNumber,riderAccountOpeningBalance
        } = req.body;

        const {
            addharCardImage, panCardImage, drivingLicenseImage, profileImage
        } = req.files || {};

        console.log(req.body)
        console.log(req.files)
        // Field validations
        const requiredFields = {
            username, firstname, mobile, role, password, store, 
            bankAccountNumber, ifscCode, bankName,
            addharCardNumber, panCardNumber, drivingLicenseNumber, riderAccountNumber,riderAccountOpeningBalance
        };

        // Validate required fields
        for (let key in requiredFields) {
            if (!requiredFields[key]) {
                return res.status(400).json({ message: `${key} is required` });
            }
        }

        // Validate image arrays
        if (!addharCardImage?.length || !panCardImage?.length || !drivingLicenseImage?.length) {
            return res.status(400).json({ message: "All ID images are required" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check role
        const roleDoc = await Role.findById(role);
        if (!roleDoc) {
            return res.status(400).json({ message: "No such role exists" });
        }

        // Check warehouse
        const StoreDoc = await Store.findById(store);
        if (!StoreDoc) {
            return res.status(400).json({ message: "No such store exists" });
        }

        // Process image arrays
        const aadharImageFiles = addharCardImage.map(file => file.filename);
        const panImageFiles = panCardImage.map(file => file.filename);
        const licenseImageFiles = drivingLicenseImage.map(file => file.filename);
        const profileImageFiles = profileImage?.map(file => file.filename) ;

      const riderAccount=await  RiderAccount.create({
        accountNumber:riderAccountNumber,
        openingBalance:riderAccountOpeningBalance,
        currentBalance:riderAccountOpeningBalance,
      })
      const transcationDetail={
          transcationId:generateTransactionCode(),
  amount: riderAccountOpeningBalance,
  type: "Opening Balance",
  format: "Credited",
  date: new Date()
      }



        // Create rider
        const response = await Rider.create({
            username,
            riderAccount:riderAccount._id,
            firstname,
            lastname,
            mobile,
            email,
            role,
            password: hashedPassword,
            store,
            status,
            bankAccountNumber,
            ifscCode,
            bankName,
            addharCardNumber,
            panCardNumber,
            drivingLicenseNumber,
            addharCardImage: aadharImageFiles,  // Now storing array of filenames
            panCardImage: panImageFiles,       // Now storing array of filenames
            drivingLicenseImage: licenseImageFiles,
            profileImage: profileImageFiles,    // Optional array of profile images
               RiderTranscation: transcationDetail 
        });

        return res.status(201).json({
            message: "Rider created successfully",
            data: response
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


exports.updateRider = async (req, res) => {
  try {
    const riderId = req.params.id;
    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }
     console.log("Update rider info",req.body)
    const imageFields = [
      "addharCardImage",
      "panCardImage",
      "profileImage",
      "drivingLicenseImage",
    ];
   const t=req.body;
    let updateData = { ...req.body };

    imageFields.forEach((field) => {
      // Get old images from DB
      let existingImages = Array.isArray(rider[field]) ? rider[field] : [];

      // Get incoming images from body
      let incomingImages = req.body[field] || [];
      if (!Array.isArray(incomingImages)) {
        incomingImages = [incomingImages];
      }

      // Add newly uploaded files for this field
      if (req.files && req.files[field]) {
        const uploadedFilenames = req.files[field].map((file) => file.filename);
        incomingImages = [...incomingImages, ...uploadedFilenames];
      }

      // Find images to remove (exist in DB but not in new list)
      const removedImages = existingImages.filter(
        (img) => !incomingImages.includes(img)
      );

      removedImages.forEach((img) => {
        const imgPath = path.join(__dirname, "../uploads/riders", img);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });

      // Final array for this field
      updateData[field] = incomingImages;
    });
   console.log("update data",updateData)
    const updatedRider = await Rider.findByIdAndUpdate(riderId, updateData, {
      new: true,
    });

    return res.json({
      message: "Rider updated successfully",
      data:updateData,
      t:t,
      rider: updatedRider,
    });
  } catch (error) {
    console.error("Error updating rider:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};



exports.getAllRider=async (req,res)=>{
   try {
      const data=await Rider.find()
      .populate("store" ,"StoreName StoreCode")
      .populate("role","roleName description permissions")
      .populate("riderAccount")
      .populate("RiderTranscation")
      res.status(200).json({
        message:"Rider Fetched Successfully",
        data:data
      })
   } catch (error) {
    res.status(400).json({
        message:"Internal server error",
        error:error.message
    })
   }
}


exports.deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "ID is required",
      });
    }

    const deletedRider = await Rider.findByIdAndDelete(id);

    if (!deletedRider) {
      return res.status(404).json({
        message: "No such Rider exists",
      });
    }

    return res.status(200).json({
      message: "Rider deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



exports.getAvailableRider=async (req,res)=>{
   try {
      const data=await Rider.find({status:"Active"})
      .populate("store" ,"StoreName StoreCode")
      .populate("role","roleName description permissions")
      .populate("riderAccount")
      .populate("RiderTranscation")
      res.status(200).json({
        message:"Rider Fetched Successfully",
        data:data
      })
   } catch (error) {
    res.status(400).json({
        message:"Internal server error",
        error:error.message
    })
   }
}


exports.giveRating=async(req,res)=>{
  try {
        const id=req.params.riderid
        const{customerId,description,likes}=req.body
        if(!customerId){
          return res.status(400).json({
            message:"Customer id is required"
          })
        }
        const riderExist=await Rider.findById(id)
        if(!riderExist){
          return res.status(400).json({
            message:"No such order exist"
          })
        }
        const rating=[...riderExist.riderRating  ,{
          description:description,
          customerId:customerId,
          likes:likes
        }]
        const updateRider=await Rider.findByIdAndUpdate(id,{
          riderRating:rating
        })
        return res.status(200).json({
          success:true,
          message:"Review submitted successfully",
          data:updateRider
        })
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}


exports.riderLogin=async(req,res)=>{
   try {
    const {email,password}=req.body;
    if(!email || !password){ 
     return res.status(500).json({
       message: "Email and password are required"
     });
    }
 
    const rider= await Rider.findOne({ email });
 
    if (!rider) {
      return res.status(404).json({
        message: "Rider not found"
      });
    }
 
   const isMatch=await bcrypt.compare(password,rider.password)
 
   if(!isMatch){
     return res.status(401).json({
       message: "Invalid credentials"
     });
   }
 
   const token = jwt.sign({ id: rider._id }, process.env.JWT_SECRET, {
     expiresIn: "10d"
   });
 
   return res.status(200).json({
     message: "Login successful",
     token
   });
   } catch (error) {
      return res.status(500).json({
        message:"Internal server error",
        error:error.message
      })
   }
}



