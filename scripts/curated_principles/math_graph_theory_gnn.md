---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 그래프 이론, 그래프 신경망, 인접 행렬, 라플라시안, 메시지 전달, GCN, 스펙트럴 그래프, WL 테스트
keywords_en: graph theory, graph neural network, adjacency matrix, Laplacian, message passing, GCN, spectral graph, WL test
---
Graph Theory and Graph Neural Networks - 그래프의 수학적 이론을 신경망에 접목하여 관계와 구조를 직접 학습하는 아키텍처

## 다리 문제에서 시작된 수학

1736년, Leonhard Euler는 쾨니히스베르크(Konigsberg)의 일곱 다리 문제를 풀면서 그래프 이론을 창시했다. "모든 다리를 정확히 한 번씩 건너 출발점으로 돌아올 수 있는가?" Euler는 이 문제에서 핵심이 다리의 길이나 위치가 아니라, 무엇이 무엇과 연결되어 있는가라는 **위상적 관계**임을 간파했다. 땅덩이를 노드(node)로, 다리를 엣지(edge)로 추상화한 것이 그래프 G = (V, E)의 탄생이다.

이후 약 280년간 그래프 이론은 순수 수학, 컴퓨터 과학, 사회학, 화학, 생물학에 걸쳐 발전했다. 분자 구조, 소셜 네트워크, 교통망, 지식 베이스 등 현실 세계의 수많은 데이터가 본질적으로 그래프 구조를 가지고 있음에도, 전통적 신경망(CNN, RNN)은 격자형(grid) 또는 순차적(sequential) 데이터만 다룰 수 있었다. 이 간극을 메운 것이 그래프 신경망(Graph Neural Network, GNN)이다.

## 그래프의 행렬 표현

그래프를 신경망에 입력하려면 수학적 표현이 필요하다. 핵심 행렬 세 가지가 있다.

인접 행렬(adjacency matrix) A는 N x N 행렬로, A_ij = 1이면 노드 i와 j가 연결되어 있고, 0이면 연결되지 않은 것이다. 무방향 그래프에서 A는 대칭이다.

차수 행렬(degree matrix) D는 대각 행렬로, D_ii는 노드 i에 연결된 엣지의 수다.

그래프 라플라시안(graph Laplacian)은 L = D - A로 정의된다. 라플라시안은 그래프 이론에서 가장 중요한 행렬 중 하나로, 그 고유값(eigenvalue)이 그래프의 연결성, 확산 속도, 클러스터 구조 등 전역적 성질을 인코딩한다. 이산 라플라시안은 연속 공간의 라플라스 연산자(Laplace operator)의 그래프 위 대응물이다. 유클리드 공간에서 라플라스 연산자가 열 전도와 확산을 기술하듯, 그래프 라플라시안은 그래프 위에서의 신호 확산과 평활화(smoothing)를 기술한다.

Fan Chung(1997)의 스펙트럴 그래프 이론(spectral graph theory)은 라플라시안의 고유값 분해가 그래프의 구조적 성질을 드러낸다는 것을 체계화했다. 두 번째로 작은 고유값(Fiedler value)은 그래프의 연결 강도를 측정하며, 고유벡터는 스펙트럴 클러스터링(spectral clustering)의 기반이 된다.

## 스펙트럴 접근: 그래프 위의 합성곱

유클리드 공간에서 합성곱(convolution)은 푸리에 변환을 통해 주파수 영역 곱셈으로 변환할 수 있다. 그래프 위에서도 동일한 논리가 가능한가? Bruna et al.(2014)은 그렇다고 답했다. 그래프 라플라시안의 고유벡터가 유클리드 공간의 푸리에 기저에 대응한다는 관찰이 핵심이었다.

정규화된 라플라시안 L = I - D^(-1/2) * A * D^(-1/2)의 고유값 분해 L = U * Lambda * U^T에서, U의 열벡터들이 그래프의 "주파수 기저"를 형성한다. 작은 고유값에 대응하는 고유벡터는 저주파(그래프 전체에 걸친 부드러운 변화)를, 큰 고유값은 고주파(인접 노드 간 급격한 변화)를 나타낸다.

이 기저를 사용한 스펙트럴 합성곱은 다음과 같이 정의된다. 입력 신호 x의 그래프 푸리에 변환은 x_hat = U^T * x이고, 필터 g와의 합성곱은 g * x = U * (g_hat . (U^T * x))이다. 여기서 g_hat은 학습 가능한 스펙트럴 필터 계수이고, .은 원소별 곱이다.

이 접근의 문제는 계산 비용이다. U의 계산(고유값 분해)이 O(N^3)이고, 모든 노드에 대한 변환도 O(N^2)다. 대규모 그래프에서는 비현실적이다.

## GCN: 근사와 돌파

Kipf & Welling(2017)의 GCN(Graph Convolutional Network)은 스펙트럴 합성곱을 1차 체비셰프 다항식으로 근사하여 공간 도메인의 간결한 공식을 도출했다.

H^(l+1) = sigma(D_hat^(-1/2) * A_hat * D_hat^(-1/2) * H^(l) * W^(l))

여기서 A_hat = A + I는 자기 루프(self-loop)를 추가한 인접 행렬이고, D_hat은 A_hat의 차수 행렬, H^(l)은 l번째 레이어의 노드 특징 행렬, W^(l)은 학습 가능한 가중치, sigma는 활성화 함수다.

이 공식의 직관은 명쾌하다. 각 노드는 자신과 이웃 노드들의 특징을 수집하여 가중 평균한 뒤, 선형 변환과 비선형 활성화를 적용한다. D_hat^(-1/2) * A_hat * D_hat^(-1/2) 항은 정규화된 인접 행렬로, 차수가 높은 노드의 기여를 조절한다.

핵심 돌파는 계산 비용이다. 스펙트럴 방법의 O(N^3)에서 O(|E|)로 극적으로 줄어든다. 여기서 |E|는 엣지 수로, 희소 그래프에서 노드 수 N에 비해 훨씬 작다.

## 메시지 전달 프레임워크

Gilmer et al.(2017)은 다양한 GNN 변형을 통합하는 메시지 전달 신경망(Message Passing Neural Network, MPNN) 프레임워크를 제안했다. 각 레이어에서 두 단계가 반복된다.

메시지 수집: m_v^(l) = Aggregate({M(h_u^(l), h_v^(l), e_uv) : u in N(v)})
노드 갱신: h_v^(l+1) = Update(h_v^(l), m_v^(l))

여기서 N(v)는 노드 v의 이웃 집합, M은 메시지 함수, e_uv는 엣지 특징, Aggregate는 집합 함수(합, 평균, 최대), Update는 갱신 함수다. GCN, GraphSAGE(Hamilton et al., 2017), GAT(Velickovic et al., 2018) 등 주요 GNN 아키텍처는 모두 이 프레임워크의 특수 사례로 이해할 수 있다.

GAT는 이웃 노드의 기여를 균등하게 또는 차수 기반으로 가중하는 대신, 어텐션 메커니즘으로 각 이웃의 중요도를 학습한다. 이는 Transformer의 self-attention이 그래프 구조(각 토큰이 모든 다른 토큰과 연결된 완전 그래프)에 대한 메시지 전달로 볼 수 있다는 관점과 연결된다.

## 표현력의 한계: WL 테스트

Xu et al.(2019)의 GIN(Graph Isomorphism Network)은 GNN의 표현력에 대한 이론적 한계를 규명했다. 핵심 결과는 메시지 전달 GNN의 판별력이 Weisfeiler-Leman(WL) 그래프 동형 판별 테스트와 동등하다는 것이다.

WL 테스트(1968)는 반복적으로 각 노드의 레이블을 자신과 이웃 레이블의 집합으로 갱신하여, 두 그래프가 구조적으로 같은지 판별한다. 이 테스트가 구분하지 못하는 비동형 그래프 쌍이 존재하며(예: 특정 정규 그래프), 메시지 전달 GNN도 동일한 한계를 공유한다.

GIN은 Aggregate 함수로 합(sum)을 사용하고 갱신에 다층 퍼셉트론(MLP)을 적용하면, WL 테스트와 정확히 같은 판별력을 달성한다는 것을 증명했다. 평균(mean)이나 최대(max) 집합은 정보를 손실하여 WL 테스트보다 약하다. 예를 들어 max 집합은 {1, 1, 2}와 {1, 2, 2}를 구분하지 못한다.

이 결과는 메시지 전달 GNN의 표현력에 천장이 있음을 보여주며, 이를 돌파하기 위해 고차 WL 테스트에 기반한 k-GNN, 부분그래프 구조를 활용하는 방법, 위치 인코딩을 추가하는 방법 등이 연구되고 있다.

## 한계와 약점

GNN은 그래프 구조 데이터에 대한 강력한 도구이지만, 여러 근본적 한계를 가진다.

- 과평활화(over-smoothing): GCN 레이어를 깊이 쌓으면, 모든 노드의 표현이 수렴하여 구별 불가능해진다. 각 레이어에서 이웃의 특징을 평균하는 과정이 반복되면, 결국 그래프의 모든 노드가 동일한 표현을 갖게 된다. 이는 열 확산 방정식에서 충분한 시간이 지나면 온도가 균일해지는 것과 수학적으로 동일하다. Li et al.(2018)은 GCN이 라플라시안 평활화의 특수한 형태임을 보였다.
- 대규모 그래프 확장성: 전체 그래프의 인접 행렬을 메모리에 올려야 하는 GCN의 구조는 수십억 노드의 그래프에서 한계가 있다. GraphSAGE의 이웃 샘플링, ClusterGCN의 서브그래프 분할 등이 제안되었지만, 전역 구조 정보의 손실이 불가피하다.
- WL 표현력 한계: 메시지 전달 GNN은 1차 WL 테스트를 넘지 못한다. 특정 정규 그래프, 순환 그래프의 길이 판별 등에서 본질적으로 실패한다. 이론적으로 더 강력한 k-WL 기반 모델은 계산 비용이 O(N^k)로 급증한다.
- 이질적 그래프: 대부분의 GNN은 동질적(homogeneous) 그래프를 가정한다. 현실의 지식 그래프처럼 다양한 노드 타입과 관계 타입이 공존하는 이질적 그래프에서는 타입별 메시지 함수가 필요하며, 모델 복잡도가 증가한다.
- 동적 그래프: 시간에 따라 노드와 엣지가 추가/삭제되는 동적 그래프는 정적 GNN으로 다루기 어렵다. 각 시점에서 재계산이 필요하거나, 시간 차원을 통합한 별도 아키텍처가 요구된다.

## 용어 정리

인접 행렬(adjacency matrix) - 그래프의 노드 간 연결 관계를 나타내는 정방 행렬. A_ij가 1이면 연결, 0이면 비연결

그래프 라플라시안(graph Laplacian) - L = D - A로 정의되는 행렬. 그래프 위의 확산과 연결성을 인코딩

스펙트럴 그래프 이론(spectral graph theory) - 그래프 라플라시안의 고유값과 고유벡터를 통해 그래프의 구조적 성질을 분석하는 이론

메시지 전달(message passing) - 각 노드가 이웃의 정보를 수집하고 자신의 표현을 갱신하는 GNN의 핵심 연산 패러다임

GCN(Graph Convolutional Network) - 스펙트럴 합성곱을 1차 근사하여 효율적인 그래프 합성곱을 수행하는 신경망 모델

GAT(Graph Attention Network) - 어텐션 메커니즘으로 이웃 노드의 기여도를 학습하는 그래프 신경망

WL 테스트(Weisfeiler-Leman test) - 노드 레이블의 반복적 갱신으로 그래프 동형 여부를 판별하는 알고리즘. 메시지 전달 GNN의 표현력 상한

과평활화(over-smoothing) - GNN의 레이어가 깊어질수록 노드 표현이 수렴하여 구별 불가능해지는 현상

자기 루프(self-loop) - 노드가 자기 자신과 연결된 엣지. GCN에서 A_hat = A + I로 추가하여 자기 정보를 보존

지식 그래프(knowledge graph) - 엔티티(노드)와 관계(엣지)로 구조화된 사실의 그래프. 추론과 질의응답에 활용

---EN---
Graph Theory and Graph Neural Networks - Architecture that grafts the mathematical theory of graphs onto neural networks to directly learn relationships and structure

## A Mathematics Born from a Bridge Problem

In 1736, Leonhard Euler founded graph theory while solving the Seven Bridges of Konigsberg problem. "Can you cross all seven bridges exactly once and return to the starting point?" Euler recognized that the essence of this problem was not the length or location of the bridges, but the **topological relationship** of what is connected to what. Abstracting landmasses as nodes and bridges as edges gave birth to the graph G = (V, E).

Over the following roughly 280 years, graph theory developed across pure mathematics, computer science, sociology, chemistry, and biology. Despite countless real-world data being inherently graph-structured -- molecular structures, social networks, transportation networks, knowledge bases -- traditional neural networks (CNNs, RNNs) could only handle grid or sequential data. Graph Neural Networks (GNNs) bridged this gap.

## Matrix Representation of Graphs

To feed graphs into neural networks, mathematical representations are needed. Three key matrices exist.

The adjacency matrix A is an N x N matrix where A_ij = 1 if nodes i and j are connected, 0 otherwise. For undirected graphs, A is symmetric.

The degree matrix D is a diagonal matrix where D_ii is the number of edges connected to node i.

The graph Laplacian is defined as L = D - A. The Laplacian is one of the most important matrices in graph theory, with its eigenvalues encoding global properties such as connectivity, diffusion speed, and cluster structure. The discrete Laplacian is the graph counterpart of the Laplace operator in continuous space. Just as the Laplace operator describes heat conduction and diffusion in Euclidean space, the graph Laplacian describes signal diffusion and smoothing on graphs.

Fan Chung's (1997) spectral graph theory systematized how eigenvalue decomposition of the Laplacian reveals structural properties of graphs. The second smallest eigenvalue (Fiedler value) measures graph connectivity, and eigenvectors form the basis for spectral clustering.

## Spectral Approach: Convolution on Graphs

In Euclidean space, convolution can be transformed to frequency-domain multiplication via Fourier transform. Is the same logic possible on graphs? Bruna et al. (2014) answered yes. The key observation was that eigenvectors of the graph Laplacian correspond to Fourier bases in Euclidean space.

In the eigenvalue decomposition L = U * Lambda * U^T of the normalized Laplacian L = I - D^(-1/2) * A * D^(-1/2), the column vectors of U form the "frequency basis" of the graph. Eigenvectors corresponding to small eigenvalues represent low frequencies (smooth variations across the graph), while large eigenvalues represent high frequencies (sharp variations between adjacent nodes).

Spectral convolution using this basis is defined as follows. The graph Fourier transform of input signal x is x_hat = U^T * x, and convolution with filter g is g * x = U * (g_hat . (U^T * x)), where g_hat contains learnable spectral filter coefficients and . denotes element-wise multiplication.

The problem with this approach is computational cost. Computing U (eigenvalue decomposition) is O(N^3), and transformation over all nodes is O(N^2) -- impractical for large graphs.

## GCN: Approximation and Breakthrough

Kipf & Welling's (2017) GCN (Graph Convolutional Network) approximated spectral convolution with a first-order Chebyshev polynomial, deriving a concise spatial-domain formula:

H^(l+1) = sigma(D_hat^(-1/2) * A_hat * D_hat^(-1/2) * H^(l) * W^(l))

Here A_hat = A + I is the adjacency matrix with added self-loops, D_hat is the degree matrix of A_hat, H^(l) is the node feature matrix at layer l, W^(l) is a learnable weight matrix, and sigma is an activation function.

The intuition behind this formula is clear. Each node collects features from itself and its neighbors, computes a weighted average, then applies linear transformation and nonlinear activation. The D_hat^(-1/2) * A_hat * D_hat^(-1/2) term is the normalized adjacency matrix, which regulates contributions from high-degree nodes.

The key breakthrough is computational cost, dropping dramatically from the spectral method's O(N^3) to O(|E|), where |E| is the number of edges -- far smaller than N in sparse graphs.

## Message Passing Framework

Gilmer et al. (2017) proposed the Message Passing Neural Network (MPNN) framework, unifying various GNN variants. Two steps repeat at each layer:

Message aggregation: m_v^(l) = Aggregate({M(h_u^(l), h_v^(l), e_uv) : u in N(v)})
Node update: h_v^(l+1) = Update(h_v^(l), m_v^(l))

Here N(v) is the neighbor set of node v, M is the message function, e_uv is the edge feature, Aggregate is a set function (sum, mean, max), and Update is the update function. Major GNN architectures including GCN, GraphSAGE (Hamilton et al., 2017), and GAT (Velickovic et al., 2018) can all be understood as special cases of this framework.

GAT learns each neighbor's importance via attention mechanisms instead of weighting neighbor contributions uniformly or by degree. This connects to the perspective that Transformer self-attention can be viewed as message passing on a graph structure (a complete graph where each token connects to all others).

## Expressiveness Limits: The WL Test

Xu et al.'s (2019) GIN (Graph Isomorphism Network) characterized the theoretical expressiveness limits of GNNs. The key result is that the discriminative power of message passing GNNs is equivalent to the Weisfeiler-Leman (WL) graph isomorphism test.

The WL test (1968) iteratively updates each node's label with the multiset of its own and neighbor labels to determine whether two graphs are structurally identical. There exist non-isomorphic graph pairs that this test cannot distinguish (e.g., certain regular graphs), and message passing GNNs share the same limitation.

GIN proved that using sum for Aggregate and multi-layer perceptrons (MLPs) for updates achieves exactly the same discriminative power as the WL test. Mean or max aggregation loses information and is weaker than the WL test. For example, max aggregation cannot distinguish {1, 1, 2} from {1, 2, 2}.

This result demonstrates a ceiling on message passing GNN expressiveness, motivating research into k-GNNs based on higher-order WL tests, methods leveraging subgraph structures, and approaches adding positional encodings.

## Limitations and Weaknesses

GNNs are powerful tools for graph-structured data but face several fundamental limitations.

- Over-smoothing: Stacking GCN layers deeply causes all node representations to converge and become indistinguishable. As the process of averaging neighbor features repeats, eventually all nodes in the graph acquire identical representations. This is mathematically equivalent to temperature becoming uniform after sufficient time in the heat diffusion equation. Li et al. (2018) showed that GCN is a special form of Laplacian smoothing.
- Large-scale graph scalability: GCN's structure requiring the entire graph's adjacency matrix in memory has limitations for graphs with billions of nodes. GraphSAGE's neighbor sampling and ClusterGCN's subgraph partitioning have been proposed, but loss of global structural information is inevitable.
- WL expressiveness limits: Message passing GNNs cannot exceed the 1st-order WL test. They fundamentally fail at tasks like distinguishing certain regular graphs or determining cycle lengths. Theoretically more powerful k-WL based models have computational costs that surge to O(N^k).
- Heterogeneous graphs: Most GNNs assume homogeneous graphs. In heterogeneous graphs where diverse node and relation types coexist, like real-world knowledge graphs, type-specific message functions are needed, increasing model complexity.
- Dynamic graphs: Dynamic graphs where nodes and edges are added/removed over time are difficult to handle with static GNNs. Either recomputation at each time step or separate architectures integrating the temporal dimension are required.

## Glossary

Adjacency matrix - a square matrix representing connection relationships between graph nodes, where A_ij is 1 if connected, 0 otherwise

Graph Laplacian - a matrix defined as L = D - A, encoding diffusion and connectivity on the graph

Spectral graph theory - the theory analyzing structural properties of graphs through eigenvalues and eigenvectors of the graph Laplacian

Message passing - the core computational paradigm of GNNs where each node collects neighbor information and updates its own representation

GCN (Graph Convolutional Network) - a neural network model performing efficient graph convolution by first-order approximation of spectral convolution

GAT (Graph Attention Network) - a graph neural network that learns neighbor node contribution weights via attention mechanisms

WL test (Weisfeiler-Leman test) - an algorithm determining graph isomorphism through iterative node label updates, the upper bound on message passing GNN expressiveness

Over-smoothing - the phenomenon where node representations converge and become indistinguishable as GNN layers deepen

Self-loop - an edge connecting a node to itself, added as A_hat = A + I in GCN to preserve self-information

Knowledge graph - a graph of structured facts composed of entities (nodes) and relations (edges), used for reasoning and question answering
