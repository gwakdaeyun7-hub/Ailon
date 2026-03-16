---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 분자 그래프, 그래프 신경망, 메시지 전달, 분자 지문, 신경 지문, 화학 정보학, 과잉 스무딩, 등변 신경망
keywords_en: molecular graph, graph neural network, message passing, molecular fingerprint, neural fingerprint, cheminformatics, oversmoothing, equivariant neural network
---
Molecular Graph Representation - 화학의 분자 그래프 표현 전통이 GNN의 핵심 응용이자 메시지 전달 프레임워크 발전에 기여한 사례

## 화학의 분자 그래프 전통

화학자들은 분자를 그래프로 그린다. 원자를 **점(노드)**, 화학 결합을 **선(간선)**으로 표현하는 이 관행은 화학의 가장 오래된 시각 언어다. 수학자 Arthur Cayley(1857)가 이소머(isomer) -- 분자식은 같지만 구조가 다른 분자 -- 를 빠짐없이 세기 위해 그래프 이론을 화학에 처음 체계적으로 도입했다. 부탄(C4H10)은 원자 4개가 일렬로 연결된 구조와 가운데 원자에서 셋이 갈라지는 구조, 두 가지 이소머를 가진다. Cayley는 이런 구조의 개수를 트리(tree) 열거 문제로 변환해서 풀었다.

이 표현이 단순한 그림이 아닌 이유는, 분자 그래프에 화학적 성질을 결정하는 핵심 정보가 담겨 있기 때문이다. 원자의 종류(탄소인지 산소인지), 결합의 유형(단일 결합, 이중 결합, 방향족 결합), 연결 패턴(위상, topology) -- 이 세 가지가 분자의 반응성, 독성, 용해도를 좌우한다. 화학의 대원칙인 "구조가 성질을 결정한다"가 그래프 하나에 자연스럽게 인코딩되어 있는 것이다. 이를 공간적으로 비유하면, 분자 그래프는 도시의 지하철 노선도와 비슷하다. 실제 지리적 거리는 표현하지 못하지만, 어떤 역(원자)이 어떤 역과 연결되어 있는지, 환승역(분기점 원자)이 어디인지는 정확히 보여준다.

## 분자 지문에서 신경 지문으로: 화학에서 AI로의 전환

1990년대부터 화학 정보학에서는 분자를 고정된 규칙으로 이진 벡터(비트 벡터)로 변환하는 **분자 지문(molecular fingerprint)**을 널리 사용했다. 가장 대표적인 Morgan 지문(ECFP, Extended-Connectivity Fingerprint)의 작동 방식은 Morgan(1965)의 연결성 인코딩을 확장한 것이다.

1. 각 원자에 초기 식별자를 부여한다 (원자 번호, 결합 수, 전하 등)
2. 각 원자의 식별자를 이웃 원자들의 식별자와 결합하여 새 식별자로 업데이트한다
3. 이 과정을 r번 반복한다 (반경 r, 보통 2~3)
4. 모든 원자의 최종 식별자를 해시 함수로 고정 길이 비트 벡터(보통 1024~2048비트)에 매핑한다

이 과정에서 결정적 도약이 일어났다. David Duvenaud et al.(2015)이 이 반복적 이웃 정보 집계 과정을 보고 질문을 던진 것이다. "2단계의 해싱을 학습 가능한 신경망 함수로 바꾸면 어떨까?" 이것이 **신경 지문(neural fingerprint)**이며, 분자 그래프에 대한 최초의 그래프 신경망 적용 중 하나다. 핵심 대응 관계는 다음과 같다.

## 메시지 전달 신경망(MPNN): 핵심 메커니즘

Justin Gilmer et al.(2017)은 Google Brain에서 분자 성질 예측을 연구하면서, 이미 나와 있던 다양한 분자 그래프 신경망들이 하나의 공통 골격을 공유한다는 것을 발견했다. 이를 **메시지 전달 신경망(Message Passing Neural Network, MPNN)**이라는 통합 프레임워크로 정리했다.

MPNN의 한 스텝은 두 단계로 이루어진다.

1. **메시지 수집**: 노드 v의 모든 이웃 w로부터 메시지를 모은다.
   m_v^(t) = sum_{w in N(v)} M(h_v^(t), h_w^(t), e_vw)
   메시지 함수 M은 노드 v의 현재 상태 h_v, 이웃 w의 상태 h_w, 둘 사이의 간선 특성 e_vw(단일 결합인지 이중 결합인지 등)를 입력으로 받는다.

2. **상태 업데이트**: 수집된 메시지와 자신의 현재 상태를 결합하여 새로운 상태를 만든다.
   h_v^(t+1) = U(h_v^(t), m_v^(t))
   업데이트 함수 U는 이전 상태와 메시지를 결합하는 학습 가능한 함수다.

## 정보 전파 범위와 표현력의 트레이드오프

MPNN에서 레이어 수 T는 핵심 트레이드오프를 만든다.

- **T가 작을 때** (예: T=1~2): 각 원자가 직접 이웃만 참조한다. 국소적 작용기(functional group) -- 히드록시기(-OH), 카르복시기(-COOH) 같은 특정 원자 배열 -- 를 잘 포착하지만, 분자의 먼 부분 사이 상호작용은 놓친다. 약물 분자에서 한쪽 끝의 변형이 반대쪽 결합 친화도에 미치는 영향을 알 수 없다.
- **T가 클 때** (예: T=6~8): 각 원자가 분자 전체의 정보를 받아들인다. 하지만 **과잉 스무딩(oversmoothing)**이 발생한다. 메시지가 반복 전파되면서 모든 노드의 상태가 평균으로 수렴하여, 서로 다른 원자의 표현이 구별 불가능해진다. 마치 여러 색의 물감을 계속 섞으면 결국 하나의 탁한 색이 되는 것과 같다.
- **극단**: T를 무한대로 보내면, Weisfeiler-Lehman(WL) 그래프 동형 판별 검사의 한계와 동일해진다. MPNN은 WL 검사보다 강한 구분력을 가질 수 없다는 것이 Xu et al.(2019)의 GIN(Graph Isomorphism Network) 논문에서 증명되었다. 이는 특정 그래프 쌍(예: 정규 그래프)을 MPNN이 원리적으로 구별할 수 없다는 뜻이다.

## 현대 AI 기법과의 연결

분자 그래프에서 시작된 GNN 아이디어는 화학을 넘어 AI 전반으로 확산되었다. 다만 각 연결의 성격은 구분해야 한다.

**분자 그래프 전통에서 직접 영감을 받은 사례:**

- **MPNN 프레임워크**: Gilmer et al.(2017)이 분자 성질 예측이라는 화학 문제를 풀면서 정립한 메시지 전달 프레임워크는, 이후 소셜 네트워크 분석, 추천 시스템, 교통 예측 등 비화학 그래프 문제에도 표준 도구로 채택되었다. 화학의 "반복적 이웃 정보 집계"가 범용 AI 기법이 된 것이다.
- **Duvenaud의 신경 지문(2015)**: Morgan 지문의 해싱을 신경망으로 대체한 이 작업이 GNN의 "미분 가능한 그래프 처리"라는 핵심 아이디어를 확립했다. 이후 GCN(Kipf & Welling, 2017), GAT(Velickovic et al., 2018) 등 주요 GNN 변종들이 같은 원리 위에 세워졌다.

**동일한 구조적 직관을 독립적으로 공유하는 사례:**

## 한계와 약점

- **과잉 스무딩**: GNN의 메시지 전달을 많이 반복하면 모든 노드의 표현이 평균으로 수렴하여 구별 불가능해진다. 큰 분자에서 장거리 상호작용을 포착하려면 많은 레이어가 필요하지만, 레이어를 늘릴수록 국소 구조 정보가 사라지는 딜레마가 있다.
- **정적 구조의 한계**: 분자 그래프는 안정한 분자의 고정된 연결 구조를 잘 표현하지만, 화학 반응의 동적 과정 -- 결합이 끊어지고 새로 형성되는 전이 상태(transition state) -- 을 자연스럽게 다루지 못한다. 반응 네트워크 표현은 여전히 활발한 연구 주제다.
- **3D 정보 손실**: 기본 2D 분자 그래프는 배좌 유연성(conformational flexibility)을 포착할 수 없다. 하나의 분자가 취할 수 있는 수많은 3D 형태를 단일 그래프로 표현하는 것이 원리적으로 불가능하다. 3D 모델(SchNet, NequIP)도 특정 배좌 하나를 입력으로 요구한다.
- **데이터 편향과 일반화**: 학습 데이터가 기존에 합성된 분자에 치우쳐 있어, 완전히 새로운 화학 공간의 분자에 대한 예측 신뢰도가 낮다. 알려진 약물 유사 분자(drug-like molecules) 바깥으로 나가면 성능이 급격히 떨어질 수 있다.

## 용어 정리

분자 그래프(molecular graph) - 원자를 노드, 화학 결합을 간선으로 표현한 그래프 구조. 19세기 화학에서 시작된 분자의 기본 표현 방식

이소머(isomer) - 분자식은 같지만 원자의 연결 구조가 다른 분자들. 부탄(C4H10)의 직선형과 분기형이 대표적

분자 지문(molecular fingerprint) - 분자 구조를 고정 규칙으로 이진 벡터(비트 벡터)로 변환한 것. Morgan 지문(ECFP)이 대표적이며, 분자 유사성 검색에 널리 사용

신경 지문(neural fingerprint) - Duvenaud et al.(2015)이 Morgan 지문의 해싱을 학습 가능한 신경망으로 대체한 모델. 분자 그래프 GNN의 직접적 출발점

SMILES(simplified molecular input line entry system) - Weininger(1988)가 개발한 분자 그래프의 문자열 표현. 깊이 우선 탐색 경로를 따라 원자와 결합을 기록

메시지 전달 신경망(message passing neural network, MPNN) - Gilmer et al.(2017)이 제안한 그래프 신경망 통합 프레임워크. 이웃 노드의 메시지를 수집하여 노드 상태를 반복 업데이트

과잉 스무딩(oversmoothing) - GNN에서 메시지 전달 반복이 많아지면 모든 노드 표현이 평균으로 수렴하여 구별 불가능해지는 현상

등변 신경망(equivariant neural network) - 입력의 대칭 변환(회전, 이동)에 대해 출력이 물리 법칙에 맞게 변환되는 신경망. 에너지는 불변, 힘은 등변으로 처리
---EN---
Molecular Graph Representation - How chemistry's molecular graph tradition became a core GNN application and contributed to the development of the message passing framework

## The Molecular Graph Tradition in Chemistry

Chemists draw molecules as graphs. The practice of representing atoms as **nodes** and chemical bonds as **edges** is chemistry's oldest visual language. Mathematician Arthur Cayley (1857) first systematically applied graph theory to chemistry, aiming to exhaustively enumerate isomers -- molecules sharing the same formula but differing in structure. Butane (C4H10) has exactly two isomers: one where four carbon atoms connect in a straight chain, and another where three branch off from a central atom. Cayley recast counting such structures as a tree enumeration problem.

This representation is far more than a drawing because molecular graphs encode the essential information that determines chemical properties. Atom types (carbon vs. oxygen), bond types (single, double, aromatic), and connectivity patterns (topology) govern a molecule's reactivity, toxicity, and solubility. Chemistry's grand principle -- "structure determines properties" -- is naturally encoded in a single graph. Spatially, a molecular graph resembles a subway map: it cannot show actual geographic distances, but it precisely reveals which stations (atoms) connect to which, and where the transfer hubs (branching atoms) are.

## From Molecular Fingerprints to Neural Fingerprints: The Transition from Chemistry to AI

Starting in the 1990s, cheminformatics widely adopted **molecular fingerprints** -- binary vectors (bit vectors) generated from molecules using fixed rules. The most representative Morgan fingerprint (ECFP, Extended-Connectivity Fingerprint) works by extending Morgan's (1965) connectivity encoding:

1. Assign each atom an initial identifier (atomic number, bond count, charge, etc.)
2. Update each atom's identifier by combining it with its neighbors' identifiers
3. Repeat this process r times (radius r, typically 2-3)
4. Hash all atoms' final identifiers into a fixed-length bit vector (usually 1024-2048 bits)

The decisive leap happened here. David Duvenaud et al. (2015) examined this iterative neighbor aggregation process and asked: "What if we replace the hashing in step 2 with a learnable neural network function?" This became the **neural fingerprint**, one of the first graph neural network applications to molecular graphs. The key correspondences are:

## Message Passing Neural Networks (MPNN): Core Mechanism

Justin Gilmer et al. (2017) at Google Brain, while researching molecular property prediction, discovered that various existing molecular graph neural networks shared a common backbone. They formalized this as the **Message Passing Neural Network (MPNN)** framework.

One MPNN step consists of two stages:

1. **Message collection**: Gather messages from all neighbors w of node v.
   m_v^(t) = sum_{w in N(v)} M(h_v^(t), h_w^(t), e_vw)
   The message function M takes as input node v's current state h_v, neighbor w's state h_w, and the edge feature e_vw between them (whether it is a single bond, double bond, etc.).

2. **State update**: Combine collected messages with the current state to produce a new state.
   h_v^(t+1) = U(h_v^(t), m_v^(t))
   The update function U is a learnable function that merges the previous state with incoming messages.

## The Tradeoff Between Information Propagation Range and Expressiveness

In MPNNs, the number of layers T creates a core tradeoff:

- **Small T** (e.g., T=1-2): Each atom references only immediate neighbors. This captures local functional groups well -- specific atom arrangements like hydroxyl (-OH) or carboxyl (-COOH) groups -- but misses interactions between distant parts of the molecule. A modification at one end of a drug molecule's effect on binding affinity at the other end would be invisible.
- **Large T** (e.g., T=6-8): Each atom receives information from across the entire molecule. But **oversmoothing** occurs. As messages propagate repeatedly, all node states converge toward the average, making different atoms' representations indistinguishable. Like mixing many paint colors together -- eventually everything becomes a single muddy hue.
- **Extreme**: As T approaches infinity, MPNN's discriminative power hits the ceiling of the Weisfeiler-Lehman (WL) graph isomorphism test. Xu et al. (2019) proved in their GIN (Graph Isomorphism Network) paper that no MPNN can exceed the WL test's distinguishing power. This means certain graph pairs (e.g., regular graphs) are fundamentally indistinguishable by any MPNN.

## Connections to Modern AI

The GNN idea born from molecular graphs has spread beyond chemistry across AI. However, the nature of each connection must be distinguished.

**Cases directly inspired by the molecular graph tradition:**

- **The MPNN framework**: The message passing framework that Gilmer et al. (2017) established while solving the chemical problem of molecular property prediction has since been adopted as a standard tool for non-chemical graph problems including social network analysis, recommendation systems, and traffic prediction. Chemistry's "iterative neighbor information aggregation" became a general-purpose AI technique.
- **Duvenaud's neural fingerprint (2015)**: This work replacing Morgan fingerprint hashing with neural networks established the core GNN idea of "differentiable graph processing." Major GNN variants that followed -- GCN (Kipf & Welling, 2017), GAT (Velickovic et al., 2018) -- were built on the same principle.

**Cases sharing the same structural intuition independently:**

## Limitations and Weaknesses

- **Oversmoothing**: Excessive message passing iterations cause all node representations to converge toward the mean, becoming indistinguishable. Capturing long-range interactions in large molecules requires many layers, but adding layers erases local structural information -- an inherent dilemma.
- **Static structure limitation**: Molecular graphs represent stable molecules' fixed connectivity well but cannot naturally handle the dynamic processes of chemical reactions -- bond breaking and formation at transition states. Reaction network representation remains an active research area.
- **3D information loss**: Basic 2D molecular graphs cannot capture conformational flexibility. Representing the multitude of 3D shapes a single molecule can adopt as one graph is fundamentally impossible. Even 3D models (SchNet, NequIP) require a single specific conformation as input.
- **Data bias and generalization**: Training data is skewed toward previously synthesized molecules, yielding low prediction confidence for molecules in entirely novel chemical spaces. Performance can drop sharply beyond known drug-like molecules.

## Glossary

Molecular graph - a graph structure representing atoms as nodes and chemical bonds as edges; the fundamental molecular representation originating from 19th-century chemistry

Isomer - molecules sharing the same formula but differing in atomic connectivity; the linear and branched forms of butane (C4H10) are classic examples

Molecular fingerprint - a fixed-length binary vector converted from molecular structure using fixed rules; Morgan fingerprint (ECFP) is the most common, widely used for molecular similarity searching

Neural fingerprint - a model by Duvenaud et al. (2015) replacing Morgan fingerprint hashing with learnable neural networks; the direct starting point for molecular graph GNNs

SMILES (simplified molecular input line entry system) - a string representation of molecular graphs developed by Weininger (1988); records atoms and bonds along a depth-first search path

Message passing neural network (MPNN) - a unified graph neural network framework proposed by Gilmer et al. (2017); iteratively updates node states by collecting messages from neighbor nodes

Oversmoothing - the phenomenon in GNNs where excessive message passing iterations cause all node representations to converge toward the mean, becoming indistinguishable

Equivariant neural network - a neural network whose outputs transform consistently with physical laws under symmetry transformations (rotation, translation) of the input; processes energy as invariant and forces as equivariant
