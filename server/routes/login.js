const express = require("express");
const User = require("../models/user");
const LoginRoute = express.Router();
const argon2 = require("argon2");
const bodyParser = require("body-parser");

var urlencodedParser = bodyParser.urlencoded({extended: false})

LoginRoute.get('/', (req, res) => {
    res.render('login')
})
LoginRoute.post('/', urlencodedParser, async function (req, res) {
    const username = req.body.username
    const password = req.body.password

    // console.log(req.body)
    if(!username || !password)
        return res
        .status(400)
        .json({ user: username, password: "", role: false, status: false, message: 'Missing username/password'})
    
    try {
        const user = await User.findOne({username})
        if (!user)
            return res.status(400).json({ user: username, password: "", role: false, status: false,message: "Invalid username"})
        
        // All good
        const unHashPass = await argon2.verify(user.password, password)
        if (!unHashPass){
            return res.status(400).json({ user: username, password: "", role: false, status: false,message: "Incorrect password"})
        } else {
                req.session.isAuthenticated = true;
                req.session.userAuth = user
                // res.json({username, password: ""})
                // res.json({ user: username, password: "", role: user.admin, status: true, message:"Login Successfully"})
                res.redirect('./home')
        }

    } catch (error) {
        return res.status(400).json({message: error})
    }
})
LoginRoute.get('/register', (req, res) => {
    res.render('register')
})
LoginRoute.post('/register', urlencodedParser,async(req, res) => {
    const {username, password} = req.body

    if(!username || !password)
        return res
        .status(400)
        .json({status: false, message: 'Missing username/password'})
    
    try {
        const user = await User.findOne({username})
        if (user)
            return res.status(400).json({status: false, message: "Existing username"})
        
        // All good
        const hashedPass = await argon2.hash(password)
        const newUser = new User({username, password: hashedPass})
        await newUser.save()
        const Token = newUser._id;
        return res.json({status: true, message: "Created Successfull", Token})
    } catch (error) {
        return res.status(400).json({message: error})
    }
    
})

LoginRoute.get('/register/admin', (req, res) => {
    res.render('register')
})
LoginRoute.post('/register/admin', urlencodedParser,async(req, res) => {
    const {username, password} = req.body

    if(!username || !password)
        return res
        .status(400)
        .json({status: false, message: 'Missing username/password'})
    
    try {
        const user = await User.findOne({username})
        if (user)
            return res.status(400).json({status: false, message: "Existing username"})
        
        // All good
        const hashedPass = await argon2.hash(password)
        const newUser = new User({username, password: hashedPass, admin: true})
        await newUser.save()
        const Token = newUser._id;
        return res.json({status: true, message: "Created Successfull", Token})
    } catch (error) {
        return res.status(400).json({message: error})
    }  
})
function restrict(req, res, next){
    if(!req.session.isAuthenticated)
        return res.redirect('/')
    next();
}

LoginRoute.get('/profile', restrict, async (req,res)=>{
    console.log(req.session.userAuth)
    res.render('about')
})

LoginRoute.get('/logout', (req, res)=>{
    req.session.isAuthenticated = false;
    req.session.userAuth = null
    res.redirect('/')
})


module.exports = LoginRoute