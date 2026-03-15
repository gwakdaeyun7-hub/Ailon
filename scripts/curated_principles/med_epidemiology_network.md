---
difficulty: intermediate
connectionType: structural_analogy
keywords: SIR 모델, 기본 재생산수, 네트워크 확산, 영향력 최대화, 독립 확산 모델, 척도 없는 네트워크, 정보 전파
keywords_en: SIR model, basic reproduction number, network diffusion, influence maximization, independent cascade model, scale-free network, information propagation
---
Epidemiological Modeling and Network Diffusion - 전염병의 구획 모델이 정보 확산 알고리즘과 네트워크 AI에 수학적 골격을 제공하다

## 전염병 수학: 구획 모델의 탄생

1927년, 스코틀랜드의 생화학자 William Ogilvy Kermack과 군의관 Anderson Gray McKendrick은 전염병 확산을 세 개의 인구 구획(compartment)으로 나누어 기술하는 미분방정식 체계를 발표했다. SIR 모델이라 불리는 이 프레임워크에서 S는 감수성 인구(Susceptible), I는 감염 인구(Infected), R은 회복 인구(Recovered)다.

이들의 핵심 통찰은 전염병 확산이 두 변수의 곱으로 결정된다는 것이었다. 감염자가 아무리 많아도 감수성자가 없으면 전파가 멈추고, 감수성자가 가득해도 감염자가 없으면 전파가 시작되지 않는다. 이 "만남의 확률"을 수학으로 포착한 것이 SIR의 출발점이다.

비유하자면, 전염병은 마른 숲의 산불과 같다. 불(감염자)이 번지려면 아직 타지 않은 나무(감수성자)가 옆에 있어야 한다. 나무가 모두 타버리면(회복/면역) 불은 꺼진다. SIR 모델은 이 직관을 정밀한 미분방정식으로 포착했다.

## SIR 모델의 수학적 구조

SIR 모델의 미분방정식 체계는 세 개의 연립 방정식이다.

1. dS/dt = -beta * S * I
2. dI/dt = beta * S * I - gamma * I
3. dR/dt = gamma * I

각 기호의 의미는 다음과 같다.

- S(t): 전체 인구 중 아직 감염되지 않아 감염될 수 있는 비율
- I(t): 현재 감염되어 타인에게 전파할 수 있는 비율
- R(t): 감염 후 회복되어 면역을 획득한 비율
- beta: 전파율. 감염자와 감수성자가 접촉했을 때 실제로 전파가 일어나는 비율
- gamma: 회복률. 감염자가 단위 시간당 회복되는 비율. 1/gamma가 평균 감염 기간이다. gamma = 0.1이면 평균 10일간 감염 상태가 지속된다

첫 번째 방정식이 모델의 핵심이다. dS/dt = -beta * S * I에서 감소율이 S와 I의 **곱**에 비례한다는 것은, 화학의 질량 작용 법칙(law of mass action)에서 가져온 가정이다. 두 반응물의 농도가 모두 높아야 반응 속도가 빨라지듯, 감수성자와 감염자가 모두 많아야 전파가 빠르다. 이 가정에는 "모든 사람이 동등한 확률로 접촉한다"는 균질 혼합(homogeneous mixing) 전제가 깔려 있다.

극단값을 추적해 보면 이 모델의 동작이 선명해진다. 전염병 초기에 S가 거의 1(전 인구가 감수성)이면 dI/dt는 대략 (beta - gamma) * I가 되어, beta > gamma일 때 감염자 수가 지수적으로 증가한다. 반대로 전파가 진행되어 S가 gamma/beta 아래로 떨어지면 dI/dt가 음수로 전환되어 감염자 수가 감소하기 시작한다. 이 전환점이 전염병의 정점(peak)이다.

## 기본 재생산수: 하나의 숫자로 전파력을 요약하다

SIR 모델에서 가장 중요한 유도량은 기본 재생산수(basic reproduction number)다.

R_0 = beta / gamma

R_0은 전체 인구가 감수성인 상태에서 한 명의 감염자가 감염 기간 동안 평균적으로 감염시키는 사람 수다. 의미를 풀어 보면, beta는 단위 시간당 전파 건수이고 1/gamma는 감염 기간이므로, 둘을 곱하면 한 감염자의 총 전파 건수가 된다.

- R_0 > 1: 한 사람이 평균 1명 이상을 감염시키므로 전염병이 확산한다
- R_0 < 1: 한 사람이 평균 1명 미만을 감염시키므로 전염병이 소멸한다
- R_0 = 1: 확산도 소멸도 아닌 경계 상태다

집단 면역 임계치(herd immunity threshold)는 R_0에서 직접 도출된다. 전파를 차단하려면 인구의 (1 - 1/R_0) 비율이 면역을 가져야 한다. 홍역은 R_0이 약 12~18이므로 92~94%가 면역이어야 하고, COVID-19 초기 변이(R_0이 약 2.5)는 60%가 필요했다. 하나의 수식이 백신 접종률 목표치를 정량적으로 결정하는 것이다.

## 네트워크 과학과의 합류: 균질 혼합의 한계를 넘다

SIR의 균질 혼합 가정은 현실과 크게 어긋난다. 실제 사회에서 버스 기사는 하루에 수백 명과 접촉하고, 재택근무자는 소수와만 접촉한다. 접촉 패턴은 균일하지 않다.

Barabasi와 Albert(1999)의 척도 없는 네트워크(scale-free network) 이론이 이 간극을 메웠다. 실제 사회 네트워크에서 각 사람의 접촉 수(degree) 분포는 멱법칙(power law)을 따른다. 대부분의 사람은 소수와 연결되지만, 극소수의 허브(hub) 노드가 압도적으로 많은 연결을 가진다. 공항 네트워크를 생각하면 직관적이다. 대부분의 공항은 몇 개의 노선만 가지지만, 인천이나 히드로 같은 허브 공항은 수백 개 노선을 운영한다.

이 발견이 역학 모델링을 근본적으로 바꾸었다. Pastor-Satorras와 Vespignani(2001)는 척도 없는 네트워크에서 전염병의 임계치가 사라질 수 있음을 보였다. 균질 혼합 SIR에서는 R_0 < 1이면 전파가 차단되지만, 척도 없는 네트워크에서는 허브 노드를 통해 아무리 낮은 전파율에서도 전파가 지속될 수 있다. 질적으로 완전히 다른 결론이다.

## 역학에서 정보 확산으로: 구조적 유사성의 다리

전염병 확산 모델이 정보, 유행, 행동의 확산 모델링에 적용된 과정은 "직접적 영감"보다는 "구조적 유사성의 차용"으로 보는 것이 정확하다. 바이러스가 접촉을 통해 전파되듯 아이디어도 사회적 연결을 통해 퍼진다는 비유가 출발점이었고, "바이럴(viral)"이라는 용어 자체가 이 비유에서 왔다. 핵심 대응 관계는 다음과 같다.

- 감염자(Infected) --> 정보를 전파하는 활성 사용자
- 감수성자(Susceptible) --> 아직 해당 정보를 접하지 못한 사용자
- 회복자(Recovered) --> 이미 정보를 알고 있어 더 이상 전파하지 않는 사용자
- 전파율 beta --> 정보 전달 시 수용 확률
- 회복률 gamma --> 정보에 대한 관심이 식는 속도

**보존된 것**: 상태 전이의 수학적 구조(S -> I -> R), 네트워크 위에서의 확률적 전파 메커니즘, 임계치(threshold)의 개념.

**변형된 것**: 생물학적 전염은 비자발적이지만, 정보 확산은 자발적 선택을 포함한다. 사람들은 수동적으로 "감염"되는 것이 아니라, 정보의 내용, 출처의 신뢰성, 사회적 맥락을 고려하여 공유 여부를 결정한다. 또한 생물학적 전파율 beta는 비교적 안정적이지만, 정보의 전파율은 내용의 신기성(novelty)과 감정적 강도에 따라 크게 달라진다.

Kempe, Kleinberg, Tardos(2003)의 영향력 최대화(influence maximization) 문제는 이 연결의 이정표다. "소셜 네트워크에서 k명의 시드 사용자를 선택하여 정보 확산을 최대화하려면 누구를 선택해야 하는가?" 이들은 이 문제가 NP-hard임을 증명하고, SIR에서 차용한 독립 확산 모델(Independent Cascade Model)을 제안했다. 활성화된 노드가 이웃 노드를 확률적으로 활성화하고, 활성화 시도는 한 번만 가능하다(감염 후 면역과 동일). 탐욕 알고리즘으로 (1 - 1/e), 즉 약 63%의 근사 비율을 달성할 수 있다는 결과는 바이럴 마케팅 전략의 수학적 토대가 되었다.

구체적 시나리오로 생각해 보자. 마케팅 예산이 시드 사용자 10명을 확보할 수 있다고 하자. 선택지 A는 팔로워 100만 명인 인플루언서 10명이다. 총 도달 잠재력은 1,000만이지만, 이들의 팔로워끼리 겹치는 비율이 높고, 인플루언서 -> 팔로워의 한 단계에서 확산이 멈추는 경향이 있다. 선택지 B는 팔로워 1만 명이지만 서로 다른 커뮤니티에 속한 사용자 10명이다. 총 도달 잠재력은 10만이지만, 각 커뮤니티 내에서 2차, 3차 전파가 연쇄적으로 일어난다. 네트워크 구조에 따라 선택지 B가 더 넓은 확산을 만들 수 있다. Kempe et al.의 탐욕 알고리즘은 이론적 최적의 63%를 보장한다는 것인데, 이 63%의 의미는 "어떤 천재적 전략으로 골라도 그 전략이 도달하는 최대 확산의 63% 이상을 이 간단한 알고리즘이 달성한다"는 것이다.

## 루머 확산과 현대 AI 응용

Daley와 Kendall(1964)은 SIR 구조를 루머 확산에 직접 대입했다.

- Ignorant(모르는 사람) = Susceptible
- Spreader(퍼뜨리는 사람) = Infected
- Stifler(더 이상 퍼뜨리지 않는 사람) = Recovered

현대 소셜 미디어에서의 오정보(misinformation) 연구로 이 프레임워크가 확장되었다. Vosoughi, Roy, Aral(2018)은 Twitter 데이터 분석을 통해 오정보가 사실보다 평균 6배 빠르게 퍼지며, 도달 범위도 넓다는 것을 실증했다. 확산 속도가 내용의 신기성과 감정적 강도에 의존한다는 발견은, SIR의 균일한 beta 가정이 정보 확산에서는 수정이 필요함을 보여주었다.

**현대 AI에서의 구조적 유사성:**

- **그래프 신경망(GNN)에서의 메시지 전달**: GNN의 핵심 연산인 메시지 전달(message passing)은 이웃 노드의 특성을 집계하여 자신의 상태를 갱신한다. 이것은 SIR에서 이웃의 감염 상태가 자신의 감염 확률에 영향을 미치는 것과 구조적으로 유사하다. 다만 GNN의 메시지 전달은 Gilmer et al.(2017)의 분자 특성 예측 연구에서 체계화된 것으로, 역학 모델에서 직접 영감을 받은 것이 아니라 독립적으로 발전한 개념이다.
- **바이럴 마케팅 알고리즘**: Kempe et al.(2003)의 영향력 최대화는 현대 추천 시스템과 소셜 미디어 알고리즘에서 시드 사용자 선정, 캠페인 최적화 등에 활용된다. 이 경우는 역학 모델의 구조를 의식적으로 차용한 사례다.

**AI에서 역학으로의 역방향 영향:**

- Kapoor et al.(2020)은 COVID-19 팬데믹 중 GNN을 이용한 전염병 예측 모델을 제안했다. 지역 간 이동 네트워크를 그래프로 표현하고, 각 지역의 감염 동태를 노드 특성으로, 지역 간 상호작용을 엣지로 모델링했다. 이는 AI 도구가 역학의 예측 능력을 높이는 역방향 사례다.
- 물리 정보 신경망(PINN) 접근에서는 SIR 방정식의 구조를 신경망의 손실 함수 제약으로 사용하면서, 데이터에서 beta와 gamma를 동시에 학습한다. 전통 모델의 수학적 구조와 신경망의 데이터 적응력을 결합한 것이다.

## 한계와 약점

- **균질 혼합 가정의 비현실성**: 기본 SIR은 모든 개체가 동등한 확률로 접촉한다고 가정한다. 현실의 이질적 접촉 패턴을 반영하려면 네트워크 기반 모델이나 에이전트 기반 모델(ABM)이 필요하며, 이는 계산 복잡도를 크게 높인다. COVID-19 팬데믹에서 R_0 추정치가 연구마다 1.5에서 6.5까지 크게 달랐던 것은 이 가정의 한계를 드러낸다.
- **정보 확산 비유의 구조적 한계**: 바이러스 전파는 비자발적이지만 정보 전파는 수용자의 판단이 개입한다. 사회적 강화(social reinforcement), 정보 과포화(saturation), 반향실 효과(echo chamber) 등 정보 확산 고유의 메커니즘을 SIR 프레임워크가 포착하지 못한다.
- **파라미터의 시간 변동성**: beta와 gamma는 정책(사회적 거리두기, 봉쇄), 계절, 치료법 발전에 따라 변한다. 고정 파라미터 모델은 이런 동적 변화에 대응이 느리고, 시변 파라미터 모델은 추정이 어렵다.
- **윤리적 우려**: 영향력 최대화 기법은 바이럴 마케팅뿐 아니라 정치적 선전이나 오정보 유포에 악용될 수 있다. 확산 모델의 정밀화가 곧 조작 도구의 정밀화이기도 하다는 양면성이 존재한다.

## 용어 정리

구획 모델(compartment model) - 인구를 상호 배타적인 몇 개의 상태(구획)로 나누고, 상태 간 전이를 미분방정식으로 기술하는 모델링 방법. SIR은 3구획, SEIR(잠복기 포함)은 4구획

기본 재생산수(basic reproduction number, R_0) - 완전 감수성 인구에서 한 감염자가 감염 기간 동안 평균적으로 감염시키는 사람 수. beta/gamma로 계산

집단 면역 임계치(herd immunity threshold) - 전파 차단에 필요한 면역 인구 비율. 1 - 1/R_0으로 도출

질량 작용 법칙(law of mass action) - 화학 반응 속도가 반응물 농도의 곱에 비례한다는 법칙. SIR에서 전파율이 S * I에 비례한다는 가정의 출처

균질 혼합(homogeneous mixing) - 인구 내 모든 개체가 동등한 확률로 접촉한다는 가정. 질량 작용 법칙 적용의 전제 조건

척도 없는 네트워크(scale-free network) - 노드의 연결 수 분포가 멱법칙을 따르는 네트워크. 소수의 허브가 다수의 연결을 가진다. Barabasi & Albert(1999)

영향력 최대화(influence maximization) - 네트워크에서 k개의 시드 노드를 선택하여 확산 범위를 최대화하는 조합 최적화 문제. NP-hard. Kempe et al.(2003)

독립 확산 모델(independent cascade model) - 활성화된 노드가 이웃 노드를 독립적 확률로 한 번만 활성화 시도하는 네트워크 확산 모델. SIR의 "감염 후 면역" 구조와 대응

멱법칙(power law) - 한 변수가 다른 변수의 거듭제곱에 비례하는 관계. P(k) ~ k^(-gamma) 형태. 소수의 극단값이 전체 분포를 지배하는 특성

메시지 전달(message passing) - GNN에서 각 노드가 이웃 노드의 정보를 집계하여 자신의 표현을 갱신하는 연산 방식

---EN---
Epidemiological Modeling and Network Diffusion - How compartment models of disease spread provided the mathematical skeleton for information diffusion algorithms and network AI

## Epidemic Mathematics: The Birth of Compartment Models

In 1927, Scottish biochemist William Ogilvy Kermack and military physician Anderson Gray McKendrick published a system of differential equations that described epidemic spread by dividing a population into three compartments. In the framework known as the SIR model, S stands for Susceptible, I for Infected, and R for Recovered.

Their key insight was that epidemic spread is determined by the product of two variables. No matter how many infected people exist, transmission stops if there are no susceptible individuals; no matter how many susceptible people there are, transmission cannot start without infected individuals. Capturing this "probability of encounter" in mathematics was SIR's starting point.

By analogy, an epidemic is like a wildfire in a dry forest. Fire (infected) can only spread when unburnt trees (susceptible) are nearby. Once all trees have burned (recovered/immune), the fire dies. The SIR model captured this intuition in precise differential equations.

## The Mathematical Structure of the SIR Model

The SIR model's system of differential equations consists of three coupled equations:

1. dS/dt = -beta * S * I
2. dI/dt = beta * S * I - gamma * I
3. dR/dt = gamma * I

Each symbol means the following:

- S(t): proportion of the population not yet infected and susceptible to infection
- I(t): proportion currently infected and capable of transmitting to others
- R(t): proportion recovered with acquired immunity
- beta: transmission rate -- the rate at which contact between infected and susceptible individuals leads to actual transmission
- gamma: recovery rate -- the fraction of infected individuals recovering per unit time. 1/gamma is the mean infectious period. If gamma = 0.1, the average infection lasts 10 days

The first equation is the model's core. In dS/dt = -beta * S * I, the fact that the decrease rate is proportional to the **product** of S and I is an assumption borrowed from chemistry's law of mass action. Just as the rate of a chemical reaction increases when both reactant concentrations are high, transmission accelerates only when both susceptible and infected populations are large. This assumption embeds a homogeneous mixing premise: "all individuals contact each other with equal probability."

Tracing the extreme values clarifies the model's behavior. Early in an epidemic, when S is nearly 1 (the entire population is susceptible), dI/dt is approximately (beta - gamma) * I, so the number of infections grows exponentially when beta > gamma. Conversely, as transmission progresses and S drops below gamma/beta, dI/dt turns negative and infections begin to decline. This turning point is the epidemic peak.

## Basic Reproduction Number: Summarizing Transmissibility in One Number

The most important derived quantity from the SIR model is the basic reproduction number:

R_0 = beta / gamma

R_0 is the average number of people one infected individual infects during their infectious period in a fully susceptible population. Unpacking the meaning: beta is the number of transmissions per unit time and 1/gamma is the duration of infection, so their product gives the total transmissions per infected individual.

- R_0 > 1: each person infects more than one on average, so the epidemic spreads
- R_0 < 1: each person infects fewer than one on average, so the epidemic dies out
- R_0 = 1: the boundary between growth and decline

The herd immunity threshold is derived directly from R_0. To block transmission, a fraction (1 - 1/R_0) of the population must be immune. Measles has an R_0 of roughly 12 to 18, requiring 92-94% immunity; early COVID-19 variants (R_0 around 2.5) required about 60%. A single formula quantitatively determines vaccination coverage targets.

## Confluence with Network Science: Beyond Homogeneous Mixing

SIR's homogeneous mixing assumption departs sharply from reality. In actual societies, a bus driver contacts hundreds daily while a remote worker contacts only a few. Contact patterns are far from uniform.

Barabasi and Albert's (1999) scale-free network theory bridged this gap. In real social networks, the distribution of each person's contact count (degree) follows a power law. Most people have few connections, but a tiny number of hub nodes hold an overwhelming number of links. Think of airport networks: most airports operate only a handful of routes, but hub airports like Incheon or Heathrow serve hundreds.

This discovery fundamentally changed epidemiological modeling. Pastor-Satorras and Vespignani (2001) showed that epidemic thresholds can vanish in scale-free networks. In homogeneous-mixing SIR, R_0 below 1 blocks transmission, but in scale-free networks, epidemics can persist through hub nodes even at extremely low transmission rates -- a qualitatively different conclusion.

## From Epidemiology to Information Diffusion: A Bridge of Structural Analogy

The application of epidemic models to the spread of information, trends, and behaviors is more accurately described as "structural analogy" than "direct inspiration." The starting point was the metaphor that ideas propagate through social connections just as viruses transmit through physical contact. The term "viral" itself comes from this analogy. The key correspondences are:

- Infected --> active users propagating information
- Susceptible --> users who have not yet encountered the information
- Recovered --> users who already know and no longer propagate
- Transmission rate beta --> probability of accepting information upon exposure
- Recovery rate gamma --> rate at which interest in the information fades

**What was preserved**: the mathematical structure of state transitions (S -> I -> R), probabilistic propagation mechanisms on networks, and the concept of thresholds.

**What was transformed**: biological contagion is involuntary, but information diffusion involves voluntary choice. People do not passively "get infected"; they decide whether to share based on content quality, source credibility, and social context. Moreover, biological transmission rate beta is relatively stable, but information transmission rates vary dramatically with content novelty and emotional intensity.

Kempe, Kleinberg, and Tardos' (2003) influence maximization problem is a milestone in this connection. "Given a social network, which k seed users should be selected to maximize information spread?" They proved this problem is NP-hard and proposed the Independent Cascade Model borrowed from SIR's structure. An activated node stochastically attempts to activate each neighbor exactly once (mirroring infection followed by immunity). Their result that a greedy algorithm achieves a (1 - 1/e), or roughly 63%, approximation ratio became the mathematical foundation for viral marketing strategies.

Consider a concrete scenario. Suppose the marketing budget allows securing 10 seed users. Option A: 10 influencers each with 1 million followers. Total potential reach is 10 million, but their follower sets overlap heavily and diffusion tends to stop after one hop (influencer to follower). Option B: 10 users each with 10,000 followers, but belonging to different communities. Total potential reach is only 100,000, yet within each community second and third-order propagation cascades occur. Depending on network structure, Option B can produce wider spread. Kempe et al.'s greedy algorithm guarantees 63% of the theoretical optimum -- meaning "no matter how brilliant a strategy anyone devises, this simple algorithm achieves at least 63% of the maximum spread that strategy could produce."

## Rumor Spreading and Modern AI Connections

Daley and Kendall (1964) directly mapped the SIR structure onto rumor propagation:

- Ignorant (unaware people) = Susceptible
- Spreader (people actively spreading) = Infected
- Stifler (people who stopped spreading) = Recovered

This framework was extended to modern misinformation research on social media. Vosoughi, Roy, and Aral (2018) analyzed Twitter data to empirically show that misinformation spreads on average six times faster than factual information and reaches a wider audience. Their finding that spread velocity depends on content novelty and emotional intensity demonstrated that SIR's uniform beta assumption needs modification for information diffusion.

**Structural similarities in modern AI:**

- **Message passing in Graph Neural Networks (GNN)**: The core operation of GNNs -- message passing -- aggregates neighbor node features to update each node's own state. This is structurally similar to how a neighbor's infection status affects one's own infection probability in SIR. However, GNN message passing was systematized in Gilmer et al.'s (2017) work on molecular property prediction and developed independently from epidemiological models, not as a direct derivative.
- **Viral marketing algorithms**: Kempe et al.'s (2003) influence maximization is used in modern recommendation systems and social media algorithms for seed user selection and campaign optimization. This case involves conscious borrowing of the epidemiological model's structure.

**Reverse influence -- AI back to epidemiology:**

- Kapoor et al. (2020) proposed a GNN-based epidemic prediction model during the COVID-19 pandemic, representing inter-regional mobility networks as graphs with infection dynamics as node features and inter-regional interactions as edges. This is a reverse case where AI tools enhance epidemiology's predictive capability.
- Physics-Informed Neural Network (PINN) approaches use SIR equation structure as neural network loss function constraints while simultaneously learning beta and gamma from data -- combining traditional models' mathematical structure with neural networks' data adaptability.

## Limitations and Weaknesses

- **Unrealistic homogeneous mixing assumption**: Basic SIR assumes all individuals contact each other with equal probability. Reflecting heterogeneous real-world contact patterns requires network-based or agent-based models (ABM), significantly increasing computational complexity. The wide variation in COVID-19 R_0 estimates across studies -- ranging from 1.5 to 6.5 -- illustrates this limitation.
- **Structural limits of the information diffusion analogy**: Viral transmission is involuntary, but information propagation involves recipient judgment. Mechanisms unique to information diffusion -- social reinforcement, information saturation, echo chambers -- cannot be captured by the SIR framework.
- **Temporal variability of parameters**: beta and gamma change with policies (social distancing, lockdowns), seasons, and treatment advances. Fixed-parameter models respond slowly to such dynamic changes, while time-varying parameter models are difficult to estimate.
- **Ethical concerns**: Influence maximization techniques can be misused not only for commercial viral marketing but also for political propaganda or misinformation dissemination. Greater precision in diffusion models simultaneously means greater precision in manipulation tools -- a fundamental duality.

## Glossary

Compartment model - a modeling method that divides a population into mutually exclusive states (compartments) and describes transitions between them with differential equations; SIR uses 3 compartments, SEIR (with incubation) uses 4

Basic reproduction number (R_0) - the average number of people one infected individual infects during their infectious period in a fully susceptible population; calculated as beta/gamma

Herd immunity threshold - the proportion of immune population required to block transmission; derived as 1 - 1/R_0

Law of mass action - a chemistry principle stating that reaction rate is proportional to the product of reactant concentrations; the source of SIR's assumption that transmission rate is proportional to S * I

Homogeneous mixing - the assumption that all individuals in a population contact each other with equal probability; a prerequisite for applying the law of mass action

Scale-free network - a network whose node degree distribution follows a power law; a few hubs hold the majority of connections; Barabasi & Albert (1999)

Influence maximization - a combinatorial optimization problem of selecting k seed nodes in a network to maximize spread; NP-hard; Kempe et al. (2003)

Independent cascade model - a network diffusion model where an activated node independently attempts to activate each neighbor exactly once with a fixed probability; corresponds to SIR's "infection then immunity" structure

Power law - a relationship where one variable is proportional to a power of another; P(k) ~ k^(-gamma) form; characterized by a few extreme values dominating the overall distribution

Message passing - the operation in GNNs where each node aggregates information from its neighbors to update its own representation
