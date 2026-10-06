const [coins,setCoins]=useState(1000);

useEffect(()=>{
  if(typeof window==="undefined") return;

  const saved=window.localStorage.getItem("lp-coins");

  if(saved!==null){
    setCoins(Number(saved)||1000);
  }
},[]);

useEffect(()=>{
  if(typeof window!=="undefined"){
    window.localStorage.setItem("lp-coins",String(coins));
  }
},[coins]);
