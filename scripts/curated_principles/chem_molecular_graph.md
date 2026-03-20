---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 분자 그래프, 그래프 신경망, 메시지 전달, 분자 지문, 신경 지문, 화학 정보학, 과잉 스무딩, 등변 신경망
keywords_en: molecular graph, graph neural network, message passing, molecular fingerprint, neural fingerprint, cheminformatics, oversmoothing, equivariant neural network
---
Molecular Graph Representation - 화학의 분자 그래프 표현 전통이 GNN의 핵심 응용이자 메시지 전달 프레임워크 발전에 기여한 사례

## 화학의 분자 그래프 전통

화학자들은 분자를 그래프로 그린다. 원자를 **점(노드)**, 화학 결합을 **선(간선)**으로 표현하는 이 관행은 화학의 가장 오래된 시각 언어다. 수학자 Arthur Cayley는 1857년에 트리 열거 이론을 발표했고, 1874년 이를 이소머(isomer) -- 분자식은 같지만 구조가 다른 분자 -- 의 개수를 체계적으로 세는 문제에 적용했다. 부탄(C4H10)은 원자 4개가 일렬로 연결된 구조와 가운데 원자에서 셋이 갈라지는 구조, 두 가지 이소머를 가진다. Cayley는 이런 구조의 개수를 트리(tree) 열거 문제로 변환해서 풀었다.

이 표현이 단순한 그림이 아닌 이유는, 분자 그래프에 화학적 성질을 결정하는 핵심 정보가 담겨 있기 때문이다. 원자의 종류(탄소인지 산소인지), 결합의 유형(단일 결합, 이중 결합, 방향족 결합), 연결 패턴(위상, topology) -- 이 세 가지가 분자의 반응성, 독성, 용해도를 좌우한다. 화학의 대원칙인 "구조가 성질을 결정한다"가 그래프 하나에 자연스럽게 인코딩되어 있는 것이다. 이를 공간적으로 비유하면, 분자 그래프는 도시의 지하철 노선도와 비슷하다. 실제 지리적 거리는 표현하지 못하지만, 어떤 역(원자)이 어떤 역과 연결되어 있는지, 환승역(분기점 원자)이 어디인지는 정확히 보여준다.

## 분자 지문에서 신경 지문으로: 화학에서 AI로의 전환

1990년대부터 화학 정보학에서는 분자를 고정된 규칙으로 이진 벡터(비트 벡터)로 변환하는 **분자 지문(molecular fingerprint)**을 널리 사용했다. 가장 대표적인 Morgan 지문(ECFP, Extended-Connectivity Fingerprint)의 작동 방식은 Morgan(1965)의 연결성 인코딩을 확장한 것이다.

1. 각 원자에 초기 식별자를 부여한다 (원자 번호, 결합 수, 전하 등)
2. 각 원자의 식별자를 이웃 원자들의 식별자와 결합하여 새 식별자로 업데이트한다
3. 이 과정을 r번 반복한다 (반경 r, 보통 2~3)
4. 모든 원자의 최종 식별자를 해시 함수로 고정 길이 비트 벡터(보통 1024~2048비트)에 매핑한다

이 과정에서 결정적 도약이 일어났다. David Duvenaud et al.(2015)이 이 반복적 이웃 정보 집계 과정을 보고 질문을 던진 것이다. "2단계의 해싱을 학습 가능한 신경망 함수로 바꾸면 어떨까?" 이것이 **신경 지문(neural fingerprint)**이며, 분자 그래프에 대한 최초의 그래프 신경망 적용 중 하나다. 핵심 대응 관계는 다음과 같다.

- Morgan 지문의 **해시 함수** --> 신경 지문의 **학습 가능한 신경망 함수** (고정 규칙이 데이터에서 학습된 함수로 대체)
- 원자의 **초기 식별자**(원자 번호, 전하 등) --> GNN의 **초기 노드 특성 벡터** (원-핫 인코딩 또는 학습된 임베딩)
- **이웃 정보 집계 반복 횟수 r** --> GNN의 **메시지 전달 레이어 수 T** (정보 전파 반경)
- 최종 **고정 길이 비트 벡터** --> **학습된 분자 임베딩** (연속 실수 벡터)
- 해시의 **비가역성**(충돌 발생, 역추적 불가) --> 신경망의 **미분 가능성** (경사 역전파로 학습 가능)

## 메시지 전달 신경망(MPNN): 분자에서 범용으로

Justin Gilmer et al.(2017)은 Google Brain에서 분자 성질 예측을 연구하면서, 기존의 다양한 분자 그래프 신경망들이 하나의 공통 골격을 공유함을 발견하고 이를 **메시지 전달 신경망(MPNN)**으로 통합했다. 각 원자(노드)가 이웃 원자의 상태와 결합 유형(단일/이중/방향족)을 수집하여 자신의 상태를 갱신하는 과정을 T번 반복한다. T번 반복이 끝나면 **readout 함수**가 모든 원자의 최종 상태를 합(sum)이나 평균(mean)으로 집계하여 분자 전체를 대표하는 단일 벡터를 만든다. Morgan 지문에서 원자 식별자를 비트 벡터로 합치는 단계에 대응한다. 화학에서 특히 중요한 것은 **간선 특성 e_vw**다. 일반 그래프와 달리 분자에서는 결합 유형이 원자 간 상호작용의 성격을 결정하기 때문이다.

## 분자 고유의 구조적 도전

MPNN의 레이어 수 T가 만드는 트레이드오프는 분자 영역에서 특히 심각하다. T가 작으면(1~2) 국소 작용기(히드록시기, 카르복시기 등)를 잘 포착하지만, 약물 분자에서 한쪽 끝의 변형이 반대쪽 결합 친화도에 미치는 장거리 효과를 놓친다. T를 늘리면 과잉 스무딩으로 원자 표현이 구별 불가능해지는데, 이는 약물-표적 상호작용에서 특정 부위의 화학적 정체성이 사라진다는 뜻이다.

## 현대 AI 기법과의 연결

분자 그래프에서 시작된 GNN 아이디어는 화학을 넘어 AI 전반으로 확산되었다. 다만 각 연결의 성격은 구분해야 한다.

**분자 그래프 전통에서 직접 영감을 받은 사례:**

- **MPNN 프레임워크**: Gilmer et al.(2017)이 분자 성질 예측이라는 화학 문제를 풀면서 정립한 메시지 전달 프레임워크는, 이후 소셜 네트워크 분석, 추천 시스템, 교통 예측 등 비화학 그래프 문제에도 표준 도구로 채택되었다. - **Duvenaud의 신경 지문(2015)**: Morgan 지문의 해싱을 신경망으로 대체한 이 작업이 GNN의 "미분 가능한 그래프 처리"라는 핵심 아이디어를 확립했다. 이후 GCN(Kipf & Welling, 2017)은 스펙트럴 그래프 이론에서, GAT(Velickovic et al., 2018)은 어텐션 메커니즘에서 각각 독립적으로 출발했지만, 모두 '이웃 정보를 집계하여 노드 표현을 갱신한다'는 동일한 핵심 원리를 공유한다.

**동일한 구조적 직관을 독립적으로 공유하는 사례:**

- **Transformer의 자기 주의(self-attention)**: 시퀀스의 모든 토큰이 다른 모든 토큰과 관계를 계산하는 것은, MPNN에서 이웃 노드의 메시지를 수집하는 것과 "국소 문맥 정보를 집계하여 표현을 풍부하게 한다"는 직관을 공유한다. 그러나 자기 주의는 NLP의 seq2seq 문제에서 독립적으로 발전했으며, 분자 그래프의 영향은 없었다.
- **포인트 클라우드 처리(PointNet++, Qi et al. 2017)**: 3D 점 집합에서 가까운 점들의 특성을 집계하여 국소 구조를 포착하는 것은, MPNN의 이웃 노드 메시지 수집과 기하학적으로 동일한 연산이다. PointNet++는 컴퓨터 비전의 3D 인식 문제에서 출발했으며, 분자 그래프나 GNN과 독립적으로 발전했다.

## 한계와 약점

- **과잉 스무딩과 장거리 상호작용의 딜레마**: 큰 분자에서 장거리 효과를 포착하려면 많은 레이어가 필요하지만, 레이어를 늘릴수록 국소 구조 정보가 사라진다.
- **정적 구조의 한계**: 분자 그래프는 안정한 분자의 고정된 연결 구조를 잘 표현하지만, 화학 반응의 동적 과정 -- 결합이 끊어지고 새로 형성되는 전이 상태(transition state) -- 을 자연스럽게 다루지 못한다.
- **3D 정보 손실**: 기본 2D 분자 그래프는 배좌 유연성(conformational flexibility)을 포착할 수 없다. 하나의 분자가 취할 수 있는 수많은 3D 형태를 단일 그래프로 표현하는 것이 원리적으로 불가능하다. 3D 모델(SchNet, NequIP)도 특정 배좌 하나를 입력으로 요구한다.
- **데이터 편향과 일반화**: 학습 데이터가 기존에 합성된 분자에 치우쳐 있어, 완전히 새로운 화학 공간의 분자에 대한 예측 신뢰도가 낮다. 알려진 약물 유사 분자(drug-like molecules) 바깥으로 나가면 성능이 급격히 떨어질 수 있다.
- **표현력의 이론적 한계**: 메시지 전달 GNN은 1차 Weisfeiler-Lehman 테스트를 넘는 그래프 구별 능력을 갖지 못한다(Xu et al., 2019). 서로 다른 성질을 가진 특정 분자 쌍을 MPNN이 구별하지 못하는 본질적 한계다.

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

Chemists draw molecules as graphs. The practice of representing atoms as **nodes** and chemical bonds as **edges** is chemistry's oldest visual language. Mathematician Arthur Cayley published his tree enumeration theory in 1857 and systematically applied it to chemistry in 1874, aiming to exhaustively enumerate isomers -- molecules sharing the same formula but differing in structure. Butane (C4H10) has exactly two isomers: one where four carbon atoms connect in a straight chain, and another where three branch off from a central atom. Cayley recast counting such structures as a tree enumeration problem.

This representation is far more than a drawing because molecular graphs encode the essential information that determines chemical properties. Atom types (carbon vs. oxygen), bond types (single, double, aromatic), and connectivity patterns (topology) govern a molecule's reactivity, toxicity, and solubility. Chemistry's grand principle -- "structure determines properties" -- is naturally encoded in a single graph. Spatially, a molecular graph resembles a subway map: it cannot show actual geographic distances, but it precisely reveals which stations (atoms) connect to which, and where the transfer hubs (branching atoms) are.

## From Molecular Fingerprints to Neural Fingerprints: The Transition from Chemistry to AI

Starting in the 1990s, cheminformatics widely adopted **molecular fingerprints** -- binary vectors (bit vectors) generated from molecules using fixed rules. The most representative Morgan fingerprint (ECFP, Extended-Connectivity Fingerprint) works by extending Morgan's (1965) connectivity encoding:

1. Assign each atom an initial identifier (atomic number, bond count, charge, etc.)
2. Update each atom's identifier by combining it with its neighbors' identifiers
3. Repeat this process r times (radius r, typically 2-3)
4. Hash all atoms' final identifiers into a fixed-length bit vector (usually 1024-2048 bits)

The decisive leap happened here. David Duvenaud et al. (2015) examined this iterative neighbor aggregation process and asked: "What if we replace the hashing in step 2 with a learnable neural network function?" This became the **neural fingerprint**, one of the first graph neural network applications to molecular graphs. The key correspondences are:

- Morgan fingerprint's **hash function** --> neural fingerprint's **learnable neural network function** (fixed rules replaced by data-learned functions)
- Atom's **initial identifier** (atomic number, charge, etc.) --> GNN's **initial node feature vector** (one-hot encoding or learned embedding)
- **Neighbor aggregation iteration count r** --> GNN's **number of message passing layers T** (information propagation radius)
- Final **fixed-length bit vector** --> **learned molecular embedding** (continuous real-valued vector)
- Hash's **irreversibility** (collisions occur, no backtracking) --> neural network's **differentiability** (learnable via gradient backpropagation)

## Message Passing Neural Networks (MPNN): From Molecules to General Purpose

Justin Gilmer et al. (2017) at Google Brain, while researching molecular property prediction, discovered that various molecular graph neural networks shared a common backbone and unified them as the **Message Passing Neural Network (MPNN)** framework. Each atom (node) collects its neighbors' states and bond types (single/double/aromatic) to update its own state, repeated T times. Once the T iterations complete, a **readout function** aggregates all atoms' final states -- typically via summation or averaging -- into a single vector representing the entire molecule. This corresponds to the final step in Morgan fingerprints where all atomic identifiers are combined into one bit vector. What makes this especially important in chemistry is the **edge feature e_vw** -- unlike generic graphs, bond type determines the nature of inter-atomic interactions in molecules.

## Molecular-Specific Structural Challenges

The tradeoff created by MPNN layer count T is particularly severe in the molecular domain. With small T (1-2), local functional groups (hydroxyl, carboxyl, etc.) are well captured, but long-range effects -- such as a modification at one end of a drug molecule affecting binding affinity at the other -- are missed. Increasing T causes oversmoothing where atom representations become indistinguishable, meaning the chemical identity of specific sites critical for drug-target interactions is lost.

## Connections to Modern AI

The GNN idea born from molecular graphs has spread beyond chemistry across AI. However, the nature of each connection must be distinguished.

**Cases directly inspired by the molecular graph tradition:**

- **The MPNN framework**: The message passing framework that Gilmer et al. (2017) established while solving the chemical problem of molecular property prediction has since been adopted as a standard tool for non-chemical graph problems including social network analysis, recommendation systems, and traffic prediction. - **Duvenaud's neural fingerprint (2015)**: This work replacing Morgan fingerprint hashing with neural networks established the core GNN idea of "differentiable graph processing." GCN (Kipf & Welling, 2017) derived from spectral graph theory and GAT (Velickovic et al., 2018) from the attention mechanism, each arriving independently, yet all share the same core principle of "aggregating neighbor information to update node representations."

**Cases sharing the same structural intuition independently:**

- **Transformer self-attention**: Computing relationships between all tokens in a sequence shares the intuition of "aggregating local context information to enrich representations" with MPNN's neighbor message collection. However, self-attention developed independently from the seq2seq problem in NLP, with no influence from molecular graphs.
- **Point cloud processing (PointNet++, Qi et al., 2017)**: Aggregating features of nearby points in a 3D point set to capture local structure is geometrically the same operation as MPNN's neighbor message collection. PointNet++ originated from 3D recognition in computer vision and developed independently from molecular graphs and GNNs.

## Limitations and Weaknesses

- **Oversmoothing vs. long-range dilemma**: Capturing long-range interactions in large molecules requires many layers, but adding layers erases local structural information.
- **Static structure limitation**: Molecular graphs represent stable molecules' fixed connectivity well but cannot naturally handle the dynamic processes of chemical reactions -- bond breaking and formation at transition states.
- **3D information loss**: Basic 2D molecular graphs cannot capture conformational flexibility. Representing the multitude of 3D shapes a single molecule can adopt as one graph is fundamentally impossible. Even 3D models (SchNet, NequIP) require a single specific conformation as input.
- **Data bias and generalization**: Training data is skewed toward previously synthesized molecules, yielding low prediction confidence for molecules in entirely novel chemical spaces. Performance can drop sharply beyond known drug-like molecules.
- **Theoretical expressivity ceiling**: Message passing GNNs cannot distinguish graphs beyond the power of the 1st-order Weisfeiler-Lehman test (Xu et al., 2019). Certain molecular pairs with different properties remain fundamentally indistinguishable to MPNNs.

## Glossary

Molecular graph - a graph structure representing atoms as nodes and chemical bonds as edges; the fundamental molecular representation originating from 19th-century chemistry

Isomer - molecules sharing the same formula but differing in atomic connectivity; the linear and branched forms of butane (C4H10) are classic examples

Molecular fingerprint - a fixed-length binary vector converted from molecular structure using fixed rules; Morgan fingerprint (ECFP) is the most common, widely used for molecular similarity searching

Neural fingerprint - a model by Duvenaud et al. (2015) replacing Morgan fingerprint hashing with learnable neural networks; the direct starting point for molecular graph GNNs

SMILES (simplified molecular input line entry system) - a string representation of molecular graphs developed by Weininger (1988); records atoms and bonds along a depth-first search path

Message passing neural network (MPNN) - a unified graph neural network framework proposed by Gilmer et al. (2017); iteratively updates node states by collecting messages from neighbor nodes

Oversmoothing - the phenomenon in GNNs where excessive message passing iterations cause all node representations to converge toward the mean, becoming indistinguishable

Equivariant neural network - a neural network whose outputs transform consistently with physical laws under symmetry transformations (rotation, translation) of the input; processes energy as invariant and forces as equivariant
