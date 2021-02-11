# Demo-Form

 cd function
 npm install
 npm install -g firebase-tools
 firebase emulators:start
```

### git command
```
 git pull origin main
 
 git status
 git add -A
 git commit -m 'comment bla bla ...'
 git push origin main
```

### clone database on firebase
```

PS C:\Users\User\OneDrive\เดสก์ท็อป\etax\Demo-Form\functions> gcgcloud auth login
 No Project Gcloud
 gcloud config set project 'PROJECT ID'

 gcloud firestore export gs://backupdataetax/database-Demo
 
 cd functions
 gsutil -m cp -r gs://backupdataetax/database-Demo .

 npm install --save firebase-admin
 
 firebase emulators:start --import ./database-Demo

 **no project firebase
 firebase login
firebase Project: list
firebase use
firebase use sld-etax

 **edit host
 netstat -ano | findstr :8080
 taskkill /PID 'Host Error' /F
```