sudo yum update -y
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo cat << EOF > /etc/nginx/conf.d/default.conf
server {
  listen 8081;
  server_name localhost;

  location / {
    proxy_pass https://${OpenSearch_Endpoint};
  }
}
EOF
sudo nginx -t
sudo systemctl restart nginx
