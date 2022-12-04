/* eslint-disable */
import { login,logout } from './login'
import {updateData} from'./updateSettings'

const form=document.querySelector('.form--login')
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm=document.querySelector('.form-user-data')

if(form){
    form.addEventListener('submit',e=>{
        const email=document.getElementById('email').value;
        const password=document.getElementById('password').value;
        e.preventDefault();
        login(email , password)
    })
    
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if(userDataForm){
    userDataForm.addEventListener('submit',e=>{
        const email=document.getElementById('email').value;
        const name=document.getElementById('password').value;
        e.preventDefault();
       updateData(email , name)
    })
    
}