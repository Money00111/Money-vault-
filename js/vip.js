.vip-section{
  padding:20px;
}

.vip-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:15px;
}

.vip-card{
  padding:18px;
  border-radius:16px;
  color:white;
  text-align:center;
  cursor:pointer;
  transition:0.3s;

  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;

  box-shadow:0 8px 20px rgba(0,0,0,0.3);
}

.vip-card h3{
  margin:5px 0;
  font-size:18px;
}

.vip-card .price{
  font-size:16px;
  font-weight:bold;
  margin:5px 0;
}

.vip-card .income{
  font-size:14px;
  opacity:0.9;
}

.vip-card:hover{
  transform:scale(1.05);
}

/* COLORS */
.vip1{background:linear-gradient(135deg,#1e3a8a,#3b82f6);}
.vip2{background:linear-gradient(135deg,#065f46,#10b981);}
.vip3{background:linear-gradient(135deg,#7c2d12,#f97316);}
.vip4{background:linear-gradient(135deg,#4c1d95,#a855f7);}
