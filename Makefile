JSFLAGS =  --preload-file res/@/ -s WASM=1 --llvm-lto 1 --no-heap-copy -s DISABLE_EXCEPTION_CATCHING=0 -s ASSERTIONS=0 -s BINARYEN_ASYNC_COMPILATION=1 -s ALLOW_MEMORY_GROWTH=1 
BOOSTINCLUDEDIR=/opt/homebrew/include/
BUILDDIR = .
SRCDIR = ../src
INCDIR = ../include
PROFILE =  #-fprofile-use #-fprofile-generate --profiling
CPPFLAGS = -O3   -I$(SRCDIR) -I./yaml-cpp/include -std=c++14  $(PROFILE) -I$(BOOSTINCLUDEDIR) 

no_gui: Network.bc LimbModel.bc Solver.bc typedefs.bc Surfaces.bc SolverEM.bc
	$(CC) $(JSFLAGS) --bind -L./yaml-cpp/build/  $(BUILDDIR)/Surfaces.bc $(BUILDDIR)/typedefs.bc $(BUILDDIR)/LimbModel.bc $(BUILDDIR)/Solver.bc $(BUILDDIR)/Network.bc  $(BUILDDIR)/SolverEM.bc  -lyaml-cpp -o no_gui.js  $(CPPFLAGS) $(LINKFLAGS) 

SolverEM.bc: $(SRCDIR)/SolverEM.cpp 
	$(CC) -c $(SRCDIR)/SolverEM.cpp -o $(BUILDDIR)/SolverEM.bc $(CPPFLAGS)

Surfaces.bc: $(SRCDIR)/Surfaces.cpp $(INCDIR)/Surfaces.hpp
	$(CC) -c $(SRCDIR)/Surfaces.cpp -o $(BUILDDIR)/Surfaces.bc $(CPPFLAGS)

Network.bc: $(SRCDIR)/Network.cpp $(INCDIR)/Network.hpp $(INCDIR)/typedefs.h
	$(CC)  -c $(SRCDIR)/Network.cpp -o $(BUILDDIR)/Network.bc $(CPPFLAGS)

LimbModel.bc: $(SRCDIR)/LimbModel.cpp $(INCDIR)/LimbModel.hpp
	$(CC) -c $(SRCDIR)/LimbModel.cpp  -o $(BUILDDIR)/LimbModel.bc $(CPPFLAGS)

Solver.bc: $(SRCDIR)/Solver.cpp $(INCDIR)/Solver.hpp
	$(CC) -c $(SRCDIR)/Solver.cpp  -o $(BUILDDIR)/Solver.bc $(CPPFLAGS)

typedefs.bc: $(SRCDIR)/typedefs.cpp $(INCDIR)/typedefs.h
	$(CC) -c  $(SRCDIR)/typedefs.cpp  -o $(BUILDDIR)/typedefs.bc $(CPPFLAGS)




clean:
	rm $(BUILDDIR)/*.bc
	rm $(BUILDDIR)/no_gui.js
	rm $(BUILDDIR)/no_gui.wasm
	rm $(BUILDDIR)/no_gui.data

	

