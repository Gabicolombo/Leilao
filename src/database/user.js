const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const auth = require('../middleware/auth')
const config = require('../config/off.json')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    nome:{
        type: String,
        required: true
    },
    apelido:{
        type:String,
        required:true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    cpf:{
        type: String,
        unique: true,
        required: true,
    },
    endereco:{
        type:String,
        required: true
    },
    senha:{
        type:String,
        trim:true,
        select:false,
        required:true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})

UserSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    
    return userObject
}

UserSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user.id.toString()}, config.secret)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

UserSchema.statics.credentials = async(email, senha)=>{
    const user = await User.findOne({email}).select('+senha')
   
    if(!user) throw new Error('Unable to login')
    
    const comparaSenha = await bcryptjs.compare(senha, user.senha)
    
    if(!comparaSenha) throw new Error('Unable to login')

    return user
}

UserSchema.pre('save', async function(prox){
    const user = this

    if(user.isModified('senha')){
        user.senha = await bcryptjs.hash(user.senha, 8)
    }
    //const hash = await bcryptjs.hash(this.senha, 8)
    //this.senha = hash
    prox()
})

const User = mongoose.model('Usuarios', UserSchema)
module.exports = User