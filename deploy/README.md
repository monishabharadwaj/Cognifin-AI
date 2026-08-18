# Cheap AWS demo (one Lightsail box)

This is the cheapest way to put the app on the internet: **one Ubuntu server + Docker Compose**. MySQL, the Node API, the Python ML service, and the frontend all run on that box. No RDS, no ECS, no load balancer.

**Use a 4 GB instance.** PyTorch inference plus MySQL will often crash a 2 GB machine.

Cost is about **$20/month** for Lightsail 4 GB (or an EC2 `t3.small`). Stop or delete the instance when you are done.

## 1. Create the server

1. AWS Console → **Lightsail** → Create instance
2. OS: **Ubuntu 24.04**
3. Plan: **$20 / 4 GB RAM / 2 vCPU**
4. Region: closest to you (Mumbai `ap-south-1` if you are in India)
5. Networking → IPv4 firewall: allow **SSH (22)** and **HTTP (80)**. If something else already uses port 80 on the instance, also allow **TCP 8080** and map the `web` service to `"8080:80"` in `docker-compose.yml`.
6. Copy the public IP

Optional: Elastic IP / static IP in Lightsail so the address does not change on reboot.

## 2. Install Docker on the instance

SSH in (Lightsail browser SSH, or `ssh -i your-key.pem ubuntu@YOUR_IP`):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```

Log out and back in so the `docker` group applies.

## 3. Copy the project onto the server

From **your PC** (Git Bash or PowerShell), from the project folder:

```bash
git clone <your-repo-url> AI-SecureFinanace-PLatform
```

Or upload with scp after you push these Docker files:

```bash
scp -r . ubuntu@YOUR_IP:~/AI-SecureFinanace-PLatform
```

On the server:

```bash
cd ~/AI-SecureFinanace-PLatform
cp .env.example .env
nano .env
```

Change the passwords and JWT secrets. Do not leave the example values.

## 4. Start the stack

First build can take **10–20 minutes** (PyTorch download).

```bash
docker compose up -d --build
```

Watch logs:

```bash
docker compose logs -f
```

When it is healthy:

- App: `http://YOUR_IP` (or `http://YOUR_IP:8080` if you published web on 8080)
- API health: `http://YOUR_IP/health` (same host/port as the app)

Demo login from `database/init.sql`:

- Email: `test@example.com`
- Password: `test123`

## 5. If something fails

| Symptom | Fix |
|---|---|
| `Killed` / exit 137 on `ml` | Instance RAM is too small. Use 4 GB. |
| API never starts | `docker compose logs api` — usually MySQL not ready; wait and `docker compose restart api` |
| Blank frontend / 404 on refresh | Rebuild `web`: `docker compose up -d --build web` |
| Browser cannot call API | You are hitting port 5000. Use `http://YOUR_IP` only (nginx on port 80). |

## 6. Stop paying

```bash
docker compose down
```

Then in Lightsail **delete the instance** (and the static IP if you created one).

This is a demo. Do not put real bank data on it. HTTP only (no HTTPS), secrets live in `.env` on the box, and `CORS_ALLOW_ALL=true` is on.
