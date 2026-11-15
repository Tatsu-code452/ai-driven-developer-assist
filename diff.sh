cd backend
npm run export src ../backend.txt
npm run export ../frontend/src ../frontend.txt

cd ../
git diff backend.txt > backend.diff.txt
git diff frontend.txt > frontend.diff.txt
