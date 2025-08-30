const customer=require("../models/NewCustomerModel")

//create new customer
exports.createCustomer = async (req, res) => {
    try {
        const {
            customerName,
            mobile,
            locationLink,
            state,
            country,
            sector,
            houseNo,
            address,
            type
        } = req.body;

        let attachment = null;

        // Safe check for uploaded file
        if (req.files && req.files.attachment && req.files.attachment.length > 0) {
            attachment = req.files.attachment[0].filename;
        }

        const response = await customer.create({
            customerName,
            mobile,
            locationLink,
            state,
            country,
            sector,
            houseNo,
            address,
            type,
            attachment
        });

        res.status(200).json({
            message: "New customer is created",
            response
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};



//get all customer
exports.getcustomer=async(req,res)=>{
    try {
        const response=await customer.find()
        if(response){
            res.status(200).json({
                message:"Customer fetched successfully",
                data:response
            })
        }
       
    } catch (error) {
        res.status(400).json({
            message:"Internal server error",
            error:error.message
        })
    }
}


//update customer by id
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await customer.findByIdAndUpdate(id, req.body, { new: true });

        if (response) {
            return res.status(200).json({
                message: "Customer updated successfully",
                data: response
            });
        }

        return res.status(404).json({  // 404 is more appropriate than 400 here
            message: "Customer not found"
        });

    } catch (error) {
        return res.status(500).json({  // 500 is more appropriate for internal errors
            message: "Internal server error",
            error: error.message
        });
    }
};



//delete by id
exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "Customer ID is required"
        });
    }

    try {
        const response = await customer.findByIdAndDelete(id);

        if (!response) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            message: "Customer deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


//customer by id
exports.getCustomerById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "Customer ID is required",
        });
    }

    try {
        const response = await customer.findById(id);

        if (!response) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            message: "Customer found successfully",
            data: response
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
