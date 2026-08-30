const admin = require('firebase-admin');
function init(){
  if(admin.apps.length) return;
  const privateKey=(process.env.FIREBASE_PRIVATE_KEY||'').replace(/\\n/g,'\n');
  if(!process.env.FIREBASE_PROJECT_ID||!process.env.FIREBASE_CLIENT_EMAIL||!privateKey||!process.env.FIREBASE_DATABASE_URL) throw new Error('Server Firebase environment variables are missing');
  admin.initializeApp({credential:admin.credential.cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey}),databaseURL:process.env.FIREBASE_DATABASE_URL});
}
function db(){init(); return admin.database();}
async function auth(req){
  init(); const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) throw Object.assign(new Error('Unauthorized'),{status:401});
  return admin.auth().verifyIdToken(h.slice(7));
}
function requireAdmin(decoded){
  const ids=(process.env.ADMIN_UIDS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(decoded.admin===true || ids.includes(decoded.uid)) return true;
  throw Object.assign(new Error('Admin access required'),{status:403});
}
function send(res,status,data){res.status(status).json(data)}
function fail(res,e){send(res,e.status||500,{ok:false,error:e.message||'Server error'})}
async function addNotification(uid,title,message,type='info'){
  const ref=db().ref('notifications/'+uid).push();
  await ref.set({id:ref.key,title,message,type,read:false,createdAt:admin.database.ServerValue.TIMESTAMP});
}
async function addLedger(uid,data){
  const ref=db().ref('transactions/'+uid).push();
  await ref.set({id:ref.key,...data,createdAt:admin.database.ServerValue.TIMESTAMP});
  return ref.key;
}
module.exports={admin,db,auth,requireAdmin,send,fail,addNotification,addLedger};
