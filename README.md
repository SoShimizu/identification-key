# MyKeyLogue

A cross-platform desktop application for interactive multi-access taxonomic keys using statistical algorithms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

（ここにアプリケーションのスクリーンショットを挿入）

## Overview

MyKeyLogue は、Excel で作成したマトリクス形式のデータから、対話的な多分岐検索キー（multi-access key）を自動生成し、利用するためのデスクトップアプリケーションです。ベイジアン推定などの統計アルゴリズムを用いることで、不確実な情報下でもっとも確からしい候補を提示し、生物種の同定作業をサポートします。

## Key Features

- **クロスプラットフォーム**: Windows, macOS, Linux で動作します。
- **マトリクスベース**: 使い慣れた Excel で形質マトリクスを簡単に作成・編集できます。
- **統計的同定エンジン**: 形質を選択するごとに、ベイズ確率に基づいてリアルタイムに候補を再計算します。
- **対話的な UI**: 候補リスト、形質リスト、タクソンの詳細情報、選択履歴などを直感的に操作できます。
- **多言語対応**: UI は日本語と英語に対応しています。

## Installation

1.  Go (1.18 以上) と Node.js (16 以上) をインストールします。
2.  Wails CLI をインストールします: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
3.  このリポジトリをクローンします: `git clone https://github.com/your-username/MyKeyLogue.git`
4.  プロジェクトディレクトリに移動します: `cd MyKeyLogue`
5.  フロントエンドの依存関係をインストールします: `cd frontend && npm install`
6.  アプリケーションをビルドします: `wails build`

## Usage

1.  `build/bin/`ディレクトリにある実行ファイルを起動します。
2.  画面上部のドロップダウンメニューから、使用したいマトリクスを選択します。
3.  右下のパネルから形質を選択していくと、右上の候補リストが更新されます。
4.  候補リストのタクソン名をクリックすると、左下のパネルに詳細情報が表示されます。

## Contributing

バグ報告や機能提案は、GitHub の Issues で受け付けています。プルリクエストも歓迎します。

## License

このプロジェクトは MIT ライセンスの下で公開されています。詳細は`LICENSE`

## Overview

`GraphCalc` is a Python library for computing a broad range of graph-theoretic invariants, purpose-built to support research in combinatorics, network science, and automated reasoning. It offers exact implementations of over 100 functions, spanning classical invariants (e.g., independence number, chromatic number, spectral radius) and a wide array of lesser-known parameters central to contemporary graph theory.

Originally developed as the invariant engine for the automated conjecturing system TxGraffiti, `GraphCalc` has since matured into a general-purpose research tool that facilitates the large-scale construction of structured, high-resolution invariant datasets. These datasets, often organized into tabular “knowledge tables,” form the basis for symbolic pattern mining, hypothesis generation, and downstream machine reasoning. For example,

```python
>>> import graphcalc as gc
>>> from graphcalc.polytopes.generators import cube_graph, octahedron_graph
>>> graphs = [cube_graph(), octahedron_graph()]
>>> functions = ["order", "size", "spectral_radius", "independence_number"]
>>> gc.compute_knowledge_table(functions, graphs)
   order  size  spectral_radius  independence_number
0      8    12              3.0                    4
1      6    12              4.0                    2
```

## Features

- **Maximum Clique**: Finds the maximum clique in a given graph.
- **Chromatic Number**: Computes the minimum number of colors required for graph coloring.
- **Vertex and Edge Cover**: Determines vertex and edge covers.
- **Matching and Independence**: Calculates maximum matching and independent sets.
- **Domination Number and its Variants**: Calculates the domination number, total domination number, and many other domination variants.
- **Degree Sequence Invariants**: Calculates the residue, annihilaiton number, the slater number and more!
- **Zero Forcing**: Calculates the zero forcing number, the total zero forcing number, the positive semidefinite zero forcing number, and the power domination number.

## Installation

To install `graphcalc`, make sure you have Python 3.7 or higher, then install it:

```bash
pip install graphcalc
```

## Linear and Integer Programming Solvers

Many of the NP-hard graph invariant computations of GraphCalc depend on third-party solvers.At least one of the following is required if you intend to use solver-based functions (e.g., `gc.maximum_independent_set(G)`):

- **CBC** (recommended):

```bash
brew install cbc      # macOS
sudo apt install coinor-cbc  # Debian/Ubuntu
```

GraphCalc will attempt to automatically detect the solver if it is installed. You can also manually specify the solver in API calls.

## Example Graph Usage

```python
from graphcalc import (
    independence_number,
    domination_number,
    zero_forcing_number,
)
from graphcalc.generators import petersen_graph

# Calculate and print the independence number of the Petersen graph.
G = petersen_graph()
print(f"Petersen graph independence number = {independence_number(G)}")

# Calculate and print the domination number of the Petersen graph.
print(f"Petersen graph domination number = {domination_number(G)}")

# Calculate and print the zero forcing number of the Petersen graph.
print(f"Petersen graph zero forcing number = {zero_forcing_number(G)}")
```

## Example Polytope Usage

```python
import graphcalc as gc
from graphcalc.polytopes.generators import (
    cube_graph,
    octahedron_graph,
    dodecahedron_graph,
    tetrahedron_graph,
    icosahedron_graph,
    convex_polytopes_text_example,
)

# Generate polytope graphs (cubes, octahedra, etc.)
G1 = cube_graph()
G2 = octahedron_graph()
G3 = dodecahedron_graph()
G4 = tetrahedron_graph()
G5 = icosahedron_graph()
G6 = convex_polytopes_text_example(1)
G7 = convex_polytopes_text_example(2)


# Function names to compute
function_names = [
    "order", # number of vertices
    "size", # number of edges
    "p_vector",
    "independence_number",
    "vertex_cover_number",
    "maximum_degree",
    "average_degree",
    "minimum_degree",
    "spectral_radius",
    "diameter",
    "radius",
    "girth",
    "algebraic_connectivity",
    "largest_laplacian_eigenvalue",
    "second_largest_adjacency_eigenvalue",
    "smallest_adjacency_eigenvalue",
    "fullerene",
    ]

# Compute properties for multiple polytopes
graphs = [G1, G2, G3, G4, G5, G6, G7]
df = gc.compute_knowledge_table(function_names, graphs)
```

## Creating Simple Graphs, Polytope Graphs, and Simple Polytope Graphs

```python
import graphcalc as gc

# Draw a simple graph
G = gc.SimpleGraph(name="Example Graph")
G.add_edges_from([(0, 1), (1, 2), (2, 3)])
G.draw()
```

### Author

So Shimizu, PhD
Web 1: <https://soshimizu.com/>
Web 2: <https://ichneumonoidea-world.com/>
Email: <parasitoidwasp.sou@gmail.com>
