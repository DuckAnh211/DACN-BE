const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(cors());
app.use(morgan('dev'));

const routes = [
  { p:'/auth', t:'http://auth-service:3000' },
  { p:'/users', t:'http://user-service:3000' },
  { p:'/classrooms', t:'http://classroom-service:3000' },
  { p:'/lessons', t:'http://lesson-service:3000' },
  { p:'/assignments', t:'http://assignment-service:3000' },
  { p:'/exams', t:'http://exam-service:3000' },
  { p:'/submissions', t:'http://submission-service:3000' },
  { p:'/meetings', t:'http://meeting-service:3000' },
  { p:'/notifications', t:'http://notification-service:3000' }
];

routes.forEach(r => app.use('/api' + r.p, createProxyMiddleware({
  target: r.t, changeOrigin: true, pathRewrite: { ['^/api' + r.p]: '/api' }
})));

app.get('/health', (_,res)=>res.json({service:'api-gateway',ok:true}));
app.listen(process.env.PORT || 4000, ()=>console.log('api-gateway listening'));
