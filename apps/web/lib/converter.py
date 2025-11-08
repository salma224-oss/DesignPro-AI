# lib/converter.py
import sys
import FreeCAD
import Part

obj_file = sys.argv[1]
step_file = sys.argv[2]

shape = Part.Shape()
shape.read(obj_file)
shape.exportStep(step_file)
print(f"STEP generated: {step_file}")
