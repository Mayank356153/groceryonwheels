const Product = require('../models/ProductModel.js');



exports.createProduct = async (req, res) => {
    const { ProductId, description } = req.body;
    const currentMedia = req.files;
    const brands = JSON.parse(req.body.brands);
    try {
        if (!ProductId) {
            return res.status(400).json({ message: "Product ID is required" });
        }
        if (!description) {
            return res.status(400).json({ message: "Description is required" });
        }
        if (!currentMedia || currentMedia.length === 0) {
            return res.status(400).json({ message: "At least one media file is required" });
        }

        const newmedia = currentMedia.map(file => file.filename); // or add path if needed

        const product = new Product({
            productId: ProductId,
            description,
            media: newmedia,
            brands
        });

        const response = await product.save();

        return res.status(201).json({ message: "Product created successfully", response });
    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({ message: error.message });
    }
};


// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        return res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ message: error.message });
    }
};


//delete product by id
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: error.message });
    }
};