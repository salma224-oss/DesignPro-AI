@echo off
echo ========================================
echo  Compilation du Rapport DesignPro AI
echo ========================================
echo.

cd rapport_latex

echo [1/4] Compilation initiale...
pdflatex -interaction=nonstopmode rapport_designpro_ai.tex

echo.
echo [2/4] Generation de la bibliographie...
bibtex rapport_designpro_ai

echo.
echo [3/4] Deuxieme compilation...
pdflatex -interaction=nonstopmode rapport_designpro_ai.tex

echo.
echo [4/4] Compilation finale...
pdflatex -interaction=nonstopmode rapport_designpro_ai.tex

echo.
echo ========================================
echo  Compilation terminee !
echo  Fichier genere : rapport_designpro_ai.pdf
echo ========================================
echo.

pause
