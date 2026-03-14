---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 분자 그래프, 그래프 신경망, 메시지 전달, 분자 표현, 약물 발견, 화학 정보학, 분자 지문
keywords_en: molecular graph, graph neural network, message passing, molecular representation, drug discovery, cheminformatics, molecular fingerprint
---
Molecular Graph Representation - 화학의 분자 그래프 전통이 그래프 신경망(GNN)의 직접적 영감이 된 사례

## 화학에서의 분자 그래프 전통

화학자들은 19세기부터 분자를 그래프로 표현해 왔다. 원자를 **노드(node)**, 화학 결합을 **간선(edge)**으로 표현하는 이 관행은 화학의 가장 기본적인 시각 언어다. Arthur Cayley(1857)는 이소머(isomer, 같은 분자식이지만 다른 구조를 가진 분자)를 열거하기 위해 그래프 이론을 화학에 처음 체계적으로 적용했다. C_n H_{2n+2} 알케인의 가능한 구조 수를 트리(tree) 열거 문제로 변환한 것이다.

이 전통은 현대 화학 정보학(cheminformatics)으로 이어졌다. Harry Morgan(1965)의 Morgan 알고리즘은 분자 그래프에서 원자의 연결성(connectivity)을 체계적으로 인코딩하여 분자를 고유하게 식별하는 표준 방법이 되었다. David Weininger(1988)의 SMILES(Simplified Molecular Input Line Entry System)는 분자 그래프를 문자열로 변환하는 표기법으로, 그래프의 깊이 우선 탐색(DFS)을 따라 원자와 결합을 순차적으로 기록한다. 예를 들어 에탄올은 CCO, 벤젠은 c1ccccc1이다.

여기서 중요한 점은, 분자 그래프가 단순한 시각화 도구가 아니라 **분자의 본질적 구조 정보를 담고 있다**는 것이다. 원자의 종류(노드 특성), 결합의 유형(단일/이중/삼중/방향족, 간선 특성), 연결 패턴(위상, topology)이 분자의 화학적 성질을 결정한다. "구조가 성질을 결정한다"는 화학의 대원칙이 그래프 표현에 자연스럽게 인코딩되어 있는 것이다.

## 분자 지문에서 신경 지문으로: 영감의 다리

전통적 화학 정보학에서는 분자를 고정된 규칙으로 이진 벡터(비트 벡터)로 변환하는 **분자 지문(molecular fingerprint)**을 사용했다. Morgan 지문(Extended-Connectivity Fingerprint, ECFP)은 각 원자의 이웃 정보를 반복적으로 해싱하여 고정 길이 벡터를 생성한다. 이 과정은 다음과 같다.

1. 각 원자에 초기 식별자를 부여한다 (원자 번호, 결합 수 등)
2. 각 원자의 식별자를 이웃 원자의 식별자와 결합하여 업데이트한다
3. 이 과정을 r번 반복한다 (반경 r)
4. 모든 원자의 최종 식별자를 해싱하여 고정 길이 비트 벡터로 변환한다

David Duvenaud et al.(2015)은 이 과정을 보고 결정적인 질문을 던졌다. "이 반복적 이웃 정보 집계 과정에서 해싱 대신 학습 가능한 함수를 사용하면 어떨까?" 이것이 **신경 지문(neural fingerprint)**이며, 분자 그래프에 대한 최초의 그래프 신경망 적용 중 하나다. 고정된 규칙 대신 데이터에서 학습하는 것으로의 전환, 이것이 영감의 핵심이다.

## 메시지 전달 신경망(MPNN): 통합 프레임워크

Justin Gilmer et al.(2017)은 다양한 분자 그래프 신경망을 **메시지 전달 신경망(Message Passing Neural Network, MPNN)**이라는 통합 프레임워크로 정리했다. MPNN의 핵심 구조는 다음과 같다.

m_v^(t) = sum_{w in N(v)} M(h_v^(t), h_w^(t), e_vw)
h_v^(t+1) = U(h_v^(t), m_v^(t))

첫 번째 식은 **메시지 함수(message function)** M이다. 노드 v의 이웃 w들로부터 메시지를 모은다. 각 메시지는 노드 v의 현재 상태 h_v, 이웃 w의 현재 상태 h_w, 그리고 간선 특성 e_vw(결합 유형 등)에 의존한다. 두 번째 식은 **업데이트 함수(update function)** U다. 수집된 메시지와 자신의 현재 상태를 결합하여 새로운 상태를 만든다. 이 과정을 T번 반복하면 각 노드는 T-홉(hop) 이내의 이웃 정보를 집약한다.

화학적으로 해석하면, t=0에서 각 원자는 자기 자신만 안다. t=1이면 직접 결합된 이웃을 안다. t=2면 이웃의 이웃까지 안다. 이것은 Morgan 알고리즘의 반복적 이웃 확장과 정확히 동일한 논리다. 차이는 고정된 해싱 대신 **학습 가능한 신경망 함수** M과 U를 사용한다는 점이다.

## 3D 기하학의 도입: SchNet에서 등변 신경망까지

2D 그래프 표현의 근본적 한계는 **3차원 공간 정보를 잃는다**는 것이다. 같은 분자식, 같은 연결 구조를 가져도 3D 배치가 다른 배좌 이성질체(conformer)는 완전히 다른 화학적 성질을 가질 수 있다. 약물-표적 상호작용은 3D 형태에 의해 결정된다.

Kristof Schutt et al.(2017)의 **SchNet**은 원자 간 거리를 연속 필터(continuous filter)로 처리하여 3D 정보를 포함한 최초의 주요 모델이다. Johannes Klicpera et al.(2020)의 **DimeNet**은 거리뿐 아니라 결합 각도(bond angle)까지 인코딩하여 방향 정보를 포착했다.

이 방향의 최종 진화가 **등변 신경망(equivariant neural network)**이다. Simon Batzner et al.(2022)의 **NequIP**이 대표적이다. 등변성이란, 분자를 회전하거나 이동해도 예측이 적절하게 변환되는 성질이다. 에너지는 회전에 불변(invariant)이어야 하고, 힘은 분자와 함께 회전(equivariant)해야 한다. 이 물리적 대칭을 신경망 구조에 내장한 것이다.

## 실제 응용과 영향

분자 그래프 신경망은 계산 화학과 약물 발견에 실질적 영향을 미치고 있다.

- **분자 성질 예측**: 용해도, 독성, 결합 친화도 등의 분자 성질을 분자 구조만으로 예측한다. 전통적 양자역학 계산(DFT 등)보다 수천 배 빠르다.
- **약물 발견**: 가상 스크리닝(virtual screening)에서 수백만 후보 분자의 활성을 GNN으로 예측하여 실험 대상을 좁힌다. 다만 이것은 AI가 화학에 도구를 **제공하는** 방향(AI→학문)이지, 화학이 AI에 영감을 **주는** 방향(학문→AI)과 구분해야 한다.
- **ML 력장(force field)**: ANI(Smith et al., 2017), NequIP(Batzner et al., 2022) 등은 분자 동역학 시뮬레이션의 원자 간 힘을 신경망으로 예측하여, ab initio 정확도에 근접하면서 계산 속도를 수 자릿수 향상시켰다.

## 한계와 약점

분자 그래프 표현과 GNN 기반 접근의 한계를 정직하게 인정해야 한다.

- **2D 한계**: 기본 분자 그래프는 3D 정보를 버린다. 배좌 유연성(conformational flexibility) -- 분자가 다양한 3D 형태를 취할 수 있는 성질 -- 을 하나의 그래프로 포착할 수 없다. SchNet, DimeNet 등 3D 모델은 이를 부분적으로 해결하지만, 특정 배좌를 입력으로 요구한다.
- **반응 동역학의 어려움**: 분자 그래프는 **안정한 분자의 정적 구조**를 잘 표현하지만, 화학 반응의 동적 과정(결합의 끊어짐과 형성, 전이 상태)을 자연스럽게 다루기 어렵다. 반응 네트워크(reaction network)는 여전히 활발한 연구 주제다.
- **과잉 스무딩(oversmoothing)**: GNN의 메시지 전달을 많이 반복하면 모든 노드의 표현이 수렴하여 구별 불가능해지는 문제가 있다. 큰 분자에서 장거리 상호작용을 포착하려면 많은 반복이 필요하지만, 그럴수록 국소 구조 정보가 사라진다.
- **데이터 편향**: 학습 데이터가 기존에 합성된 분자에 편향되어 있어, 완전히 새로운 화학 공간의 분자에 대한 일반화가 보장되지 않는다.
- **물리적 제약 미반영**: 기본 MPNN은 에너지 보존, 대칭성 등의 물리 법칙을 구조에 내장하지 않는다. 등변 신경망이 이를 부분적으로 해결하지만, 모든 물리적 제약을 포함하지는 못한다.

## 용어 정리

분자 그래프(molecular graph) - 원자를 노드, 화학 결합을 간선으로 표현한 그래프 구조. 19세기 화학에서 시작된 분자의 기본 표현 방식

분자 지문(molecular fingerprint) - 분자 구조를 고정 길이 이진 벡터로 변환한 것. Morgan 지문(ECFP)이 대표적

SMILES(simplified molecular input line entry system) - Weininger(1988)가 개발한 분자 그래프의 문자열 표현. 깊이 우선 탐색 기반

메시지 전달 신경망(message passing neural network, MPNN) - Gilmer et al.(2017)이 제안한 그래프 신경망의 통합 프레임워크. 이웃 노드로부터 메시지를 수집하여 노드 상태를 반복 업데이트

등변 신경망(equivariant neural network) - 입력의 대칭 변환(회전, 이동)에 대해 출력이 적절히 변환되는 신경망. 분자의 물리적 대칭을 구조에 내장

배좌 이성질체(conformer) - 같은 분자식과 연결 구조를 가지지만 3D 공간 배치가 다른 분자 형태

과잉 스무딩(oversmoothing) - GNN에서 메시지 전달 반복이 많아지면 모든 노드 표현이 수렴하여 구별할 수 없게 되는 문제

가상 스크리닝(virtual screening) - 대규모 분자 라이브러리에서 컴퓨터 모델로 활성 후보를 예측하여 실험 대상을 선별하는 약물 발견 방법

화학 정보학(cheminformatics) - 화학 데이터를 컴퓨터로 처리, 분석하는 학제간 분야. 분자 표현, 유사성 검색, 성질 예측 등을 포함

---EN---
Molecular Graph Representation - How chemistry's tradition of representing molecules as graphs directly inspired graph neural networks (GNNs)

## The Tradition of Molecular Graphs in Chemistry

Chemists have represented molecules as graphs since the 19th century. The practice of depicting atoms as **nodes** and chemical bonds as **edges** is chemistry's most fundamental visual language. Arthur Cayley (1857) was the first to systematically apply graph theory to chemistry, enumerating isomers (molecules with the same formula but different structures). He transformed the problem of counting possible structures of C_n H_{2n+2} alkanes into a tree enumeration problem.

This tradition continued into modern cheminformatics. Harry Morgan's (1965) algorithm systematically encoded atom connectivity in molecular graphs, becoming the standard method for uniquely identifying molecules. David Weininger's (1988) SMILES (Simplified Molecular Input Line Entry System) is a notation converting molecular graphs to strings by following a depth-first search (DFS) through the graph, recording atoms and bonds sequentially. For example, ethanol is CCO, benzene is c1ccccc1.

The crucial point is that molecular graphs are not mere visualization tools -- they **encode essential structural information about molecules**. Atom types (node features), bond types (single/double/triple/aromatic, edge features), and connectivity patterns (topology) determine a molecule's chemical properties. Chemistry's grand principle that "structure determines properties" is naturally encoded in the graph representation.

## From Molecular Fingerprints to Neural Fingerprints: The Bridge of Inspiration

Traditional cheminformatics used **molecular fingerprints** -- binary vectors (bit vectors) generated from molecules using fixed rules. The Morgan fingerprint (Extended-Connectivity Fingerprint, ECFP) iteratively hashes each atom's neighborhood information to produce a fixed-length vector. The process works as follows:

1. Assign each atom an initial identifier (atomic number, bond count, etc.)
2. Update each atom's identifier by combining it with neighbors' identifiers
3. Repeat this process r times (radius r)
4. Hash all atoms' final identifiers into a fixed-length bit vector

David Duvenaud et al. (2015) looked at this process and asked the decisive question: "What if we replace the hashing in this iterative neighbor aggregation with learnable functions?" This became the **neural fingerprint**, one of the first graph neural network applications to molecular graphs. The transition from fixed rules to learning from data -- this was the essence of the inspiration.

## Message Passing Neural Networks (MPNN): A Unifying Framework

Justin Gilmer et al. (2017) unified various molecular graph neural networks under the **Message Passing Neural Network (MPNN)** framework. The core structure of MPNN is:

m_v^(t) = sum_{w in N(v)} M(h_v^(t), h_w^(t), e_vw)
h_v^(t+1) = U(h_v^(t), m_v^(t))

The first equation is the **message function** M. It gathers messages from the neighbors w of node v. Each message depends on v's current state h_v, neighbor w's current state h_w, and edge features e_vw (bond type, etc.). The second equation is the **update function** U. It combines collected messages with the current state to produce a new state. Repeating T times, each node aggregates information from neighbors within T hops.

Chemically interpreted: at t=0, each atom knows only itself. At t=1, it knows directly bonded neighbors. At t=2, it knows neighbors of neighbors. This follows exactly the same logic as the Morgan algorithm's iterative neighborhood expansion. The difference is using **learnable neural network functions** M and U instead of fixed hashing.

## Introducing 3D Geometry: From SchNet to Equivariant Networks

The fundamental limitation of 2D graph representations is **loss of three-dimensional spatial information**. Conformers -- molecules with the same formula and connectivity but different 3D arrangements -- can have completely different chemical properties. Drug-target interactions are determined by 3D shape.

Kristof Schutt et al.'s (2017) **SchNet** was the first major model incorporating 3D information by processing interatomic distances through continuous filters. Johannes Klicpera et al.'s (2020) **DimeNet** encoded not only distances but bond angles, capturing directional information.

The ultimate evolution in this direction is the **equivariant neural network**. Simon Batzner et al.'s (2022) **NequIP** is representative. Equivariance means that when a molecule is rotated or translated, predictions transform appropriately. Energy must be invariant to rotation, while forces must rotate equivariantly with the molecule. These physical symmetries are built into the network architecture.

## Practical Applications and Impact

Molecular graph neural networks have had substantive impact on computational chemistry and drug discovery:

- **Molecular property prediction**: Predicting properties like solubility, toxicity, and binding affinity from molecular structure alone. Thousands of times faster than traditional quantum mechanical calculations (DFT, etc.).
- **Drug discovery**: In virtual screening, GNNs predict the activity of millions of candidate molecules to narrow experimental targets. Note that this is AI providing tools **to** chemistry (AI to discipline), which must be distinguished from chemistry inspiring AI (discipline to AI).
- **ML force fields**: ANI (Smith et al., 2017), NequIP (Batzner et al., 2022) and others predict interatomic forces for molecular dynamics simulations, approaching ab initio accuracy while improving computational speed by orders of magnitude.

## Limitations and Weaknesses

The limitations of molecular graph representation and GNN-based approaches must be honestly acknowledged.

- **2D limitations**: Basic molecular graphs discard 3D information. Conformational flexibility -- the ability of molecules to adopt various 3D shapes -- cannot be captured by a single graph. 3D models like SchNet and DimeNet partially address this but require specific conformations as input.
- **Difficulty with reaction dynamics**: Molecular graphs represent **static structures of stable molecules** well, but struggle with the dynamic processes of chemical reactions (bond breaking and formation, transition states). Reaction networks remain an active research topic.
- **Oversmoothing**: Excessive message passing iterations in GNNs cause all node representations to converge, becoming indistinguishable. Capturing long-range interactions in large molecules requires many iterations, but this erases local structural information.
- **Data bias**: Training data is biased toward previously synthesized molecules, so generalization to entirely novel chemical spaces is not guaranteed.
- **Missing physical constraints**: Basic MPNNs do not embed physical laws like energy conservation or symmetries into their architecture. Equivariant networks partially address this but cannot incorporate all physical constraints.

## Glossary

Molecular graph - a graph structure representing atoms as nodes and chemical bonds as edges; the fundamental molecular representation originating from 19th-century chemistry

Molecular fingerprint - a fixed-length binary vector representation of molecular structure; Morgan fingerprint (ECFP) is the most common

SMILES (simplified molecular input line entry system) - a string representation of molecular graphs developed by Weininger (1988), based on depth-first search

Message passing neural network (MPNN) - a unified framework for graph neural networks proposed by Gilmer et al. (2017); iteratively updates node states by collecting messages from neighbors

Equivariant neural network - a neural network whose outputs transform appropriately under symmetry transformations (rotation, translation) of the input; embeds molecular physical symmetries into architecture

Conformer - molecular forms with the same formula and connectivity but different 3D spatial arrangements

Oversmoothing - the problem in GNNs where excessive message passing iterations cause all node representations to converge and become indistinguishable

Virtual screening - a drug discovery method using computer models to predict active candidates from large molecular libraries to select experimental targets

Cheminformatics - an interdisciplinary field processing and analyzing chemical data computationally, including molecular representation, similarity searching, and property prediction
