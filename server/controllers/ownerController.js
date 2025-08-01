
import imagekit from "../configs/imageKit.js"
import Booking from "../models/Booking.js"
import Car from "../models/Car.js"
import User from "../models/User.js"
import fs from 'fs'

// api to change role of user
export const changeRoleToOwner = async (req, res) => {
    try {
        const { _id } = req.user
        await User.findByIdAndUpdate(_id, { role: 'owner' })
        res.json({ success: true, message: 'Now yo can list cars' })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// api to list car

export const addCar = async (req, res) => {
    try {
        const { _id } = req.user
        let car = JSON.parse(req.body.carData)
        const imageFile = req.file

        // upload image to imagekit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname ,
            folder: '/cars'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                {width: '1280'},
                {quality: 'auto'}, //auto compression
                {format: 'webp'} // convert to modern format

            ]
        });

        const image = optimizedImageUrl
        await Car.create({...car, owner: _id, image})

        res.json({success: true, message: 'Car Added'})



    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// api to list owner cars
export const getOwnerCars = async (req,res)=>{
    try {
        const { _id } = req.user
        const cars = await Car.find({owner:_id})
        res.json({success: true, cars})
    } catch (error) {
        console.log(error.message)
        res.json({success: true, message: error.message})
    }
}

// API to toggle a car's availability status (available ↔ unavailable)
export const toggleCarAvailability = async (req, res) => {
  try {
    // Get the logged-in user's ID from the token
    const { _id } = req.user

    // Get the car ID from the request body
    const { carId } = req.body

    // Find the car by its ID
    const car = await Car.findById(carId)

    // If car not found, send error response
    if (!car) {
      return res.json({ success: false, message: 'Car not found' })
    }

    // Check if the car belongs to the logged-in user (owner)
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    // Toggle the car's availability (true → false, or false → true)
    car.isAvailable = !car.isAvailable

    // Save the updated car
    await car.save()

    // Send success response
    res.json({ success: true, message: 'Availability Toggled' })

  } catch (error) {
    // Log and return error message
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}


// API to delete (deactivate) a car from listing
export const deleteCar = async (req, res) => {
  try {
    // Get the logged-in user's ID from the token
    const { _id } = req.user

    // Get the car ID from the request body
    const { carId } = req.body

    // Find the car by its ID
    const car = await Car.findById(carId)

    // If car not found, send error response
    if (!car) {
      return res.json({ success: false, message: 'Car not found' })
    }

    // Check if the car belongs to the logged-in user (owner)
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    // Instead of permanently deleting, we set the car's owner to null and make it unavailable
    car.owner = null
    car.isAvailable = false

    // Save the updated car
    await car.save()

    // Send success response
    res.json({ success: true, message: 'Car Removed' })

  } catch (error) {
    // Log and return error message
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}


// api to get dashboard data
export const getDashboardData = async (req, res)=>{
    try {
        const {_id, role} = req.user

        if(role !== 'owner'){
            return res.json({sucess:false, message:'Unauthorized'})
        }
        const cars = await Car.find({owner: _id})
        const bookings = await Booking.find({owner: _id}).populate('car').sort({createdAt: -1})

        const pendingBookings = await Booking.find({owner: _id,status:'pending'})
        const completedBookings = await Booking.find({owner: _id,status:'confirmed'})

        // calculate monthlyRevenue from bookings where status is confirmed
        const monthlyRevenue = bookings.slice().filter(booking => booking.status === 'confirmed').reduce((acc, booking)=> acc + booking.price, 0)

        const dashboardData = {
            totalCars: cars.length,
            totalBookings: bookings.length,
            pendingBookings: pendingBookings.length,
            completedBookings: completedBookings.length,
            recentBookings: bookings.slice(0,3),
            monthlyRevenue
        }
        res.json({success: true, dashboardData})
    } catch (error) {
        console.log(error.message)
        res.json({success: true, message: error.message})
    }
}

// api to update user image

export const updateUserImage = async (req,res)=>{
    try {
        const {_id} = req.user

         const imageFile = req.file

        // upload image to imagekit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname ,
            folder: '/users'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                {width: '400'},
                {quality: 'auto'}, //auto compression
                {format: 'webp'} // convert to modern format

            ]
        });

        const image = optimizedImageUrl

        await User.findByIdAndUpdate(_id,{image})
        res.json({success: true, message: 'Image updated'})

    } catch (error) {
        console.log(error.message)
        res.json({success:true, message: error.message})
    }
}