import axios from 'axios'
import { showAlert } from './alerts';

export const updateData=async(email,name)=>{
try{
const res=await axios({
    methode:'PATCH',
    url:'/api/v1/users/updateMe',
    data:{
        email,
        name
    }
})
if(res.data.status==='success'){
    showAlert('success', ' data Updated successfully!')
}
}catch(err){
    showAlert('error', err.data.message)
    console.log(err)
}
}