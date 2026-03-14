---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 역학 모델링, SIR 모델, 기본 재생산수, 네트워크 확산, 영향력 최대화, 그래프 신경망, 정보 전파, 집단 면역
keywords_en: epidemiological modeling, SIR model, basic reproduction number, network diffusion, influence maximization, graph neural network, information propagation, herd immunity
---
Epidemiological Modeling and Network Diffusion - 전염병의 수학적 확산 모델이 정보 전파와 네트워크 AI의 토대가 되다

## 전염병 수학의 탄생

1927년, 스코틀랜드의 생화학자 William Ogilvy Kermack과 군의관 Anderson Gray McKendrick은 전염병 확산을 설명하는 미분방정식 체계를 발표했다. 이 SIR(Susceptible-Infected-Recovered) 모델은 인구를 세 구획(compartment)으로 나누어 전염의 동역학을 기술하는 단순하지만 강력한 프레임워크였다.

이들의 핵심 통찰은, 전염병의 확산이 **감염된 개체와 감수성 있는 개체의 만남**이라는 확률적 과정에 의존한다는 것이었다. 이를 연속적 미분방정식으로 표현하면서, 전염병학은 정성적 관찰에서 정량적 예측 과학으로 전환되었다.

Anderson과 May(1991)의 "Infectious Diseases of Humans"는 이 수학적 전통을 확장하여, 연령 구조, 잠복기, 면역 감쇠 등을 포함하는 보다 정교한 모델들의 체계를 정립했다.

## SIR 모델: 확산의 수학적 구조

SIR 모델의 미분방정식 체계는 다음과 같다.

dS/dt = -beta * S * I
dI/dt = beta * S * I - gamma * I
dR/dt = gamma * I

각 변수와 파라미터의 의미는 이렇다.

- S(t) = 감수성 인구(Susceptible). 아직 감염되지 않아 감염될 수 있는 사람의 비율
- I(t) = 감염 인구(Infected). 현재 감염 상태로 타인에게 전파할 수 있는 사람의 비율
- R(t) = 회복 인구(Recovered). 감염 후 회복되어 면역을 획득한 사람의 비율
- beta = 전파율(transmission rate). 감염자와 감수성자가 접촉했을 때 전파가 일어나는 비율
- gamma = 회복률(recovery rate). 감염자가 회복되는 비율. 1/gamma가 평균 감염 기간

첫 번째 방정식이 모델의 핵심이다. dS/dt = -beta * S * I는 감수성 인구의 감소율이 **S와 I의 곱에 비례**한다고 말한다. 이것은 화학의 **질량 작용 법칙**(law of mass action)에서 가져온 가정으로, "만남의 빈도가 각 집단의 크기에 비례한다"는 균질 혼합(homogeneous mixing) 가정이다.

## 기본 재생산수와 집단 면역

SIR 모델에서 가장 중요한 유도량은 기본 재생산수(basic reproduction number)다.

R_0 = beta / gamma

R_0은 완전히 감수성인 인구에서 한 명의 감염자가 평균적으로 감염시키는 사람 수다.

- R_0 > 1이면 전염병이 확산한다
- R_0 < 1이면 전염병이 소멸한다
- R_0 = 1은 풍토병(endemic) 상태의 경계다

**집단 면역 임계치**(herd immunity threshold)는 R_0에서 직접 도출된다.

1 - 1/R_0

예를 들어 홍역의 R_0이 약 15라면, 인구의 1 - 1/15 = 93.3%가 면역을 가져야 전파가 차단된다. 이 수학적 결과는 백신 접종 정책의 정량적 근거가 된다.

## 네트워크 과학과의 합류

SIR 모델의 균질 혼합 가정은 심각한 한계를 가진다. 실제 사회에서 사람들의 접촉 패턴은 균일하지 않다. 일부는 수백 명과 접촉하고, 대부분은 소수와만 접촉한다.

Barabasi와 Albert(1999)의 척도 없는 네트워크(scale-free network) 이론이 이 간극을 메웠다. 실제 사회 네트워크에서 접촉 수(degree)의 분포는 **멱법칙**(power law)을 따른다. 소수의 **"허브" 노드**가 압도적으로 많은 연결을 가진다.

이 발견이 역학 모델링을 근본적으로 바꾸었다. Pastor-Satorras와 Vespignani(2001)는 척도 없는 네트워크에서 **전염병의 임계치가 사라질 수 있음**을 보였다. 허브 노드의 존재 때문에, 아무리 낮은 전파율에서도 전염이 퍼질 수 있다. 이는 균질 혼합 가정의 SIR과 질적으로 다른 결론이다.

## 정보 확산: 역학에서 소셜 네트워크로

전염병의 확산 모델이 정보, 유행, 행동의 확산에 적용되기 시작한 것은 자연스러운 확장이었다. 바이러스가 접촉을 통해 전파되듯, 아이디어와 정보도 사회적 연결을 통해 전파된다. "바이럴(viral)"이라는 용어 자체가 이 비유에서 왔다.

Kempe, Kleinberg, Tardos(2003)의 영향력 최대화(influence maximization) 문제는 이 연결의 이정표다. 소셜 네트워크에서 k명의 "시드" 사용자를 선택하여 정보 확산을 최대화하려면 누구를 선택해야 하는가? 이들은 이 문제가 NP-hard임을 증명하고, SIR 모델에서 영감받은 **독립 확산 모델**(Independent Cascade Model)과 **선형 임계치 모델**(Linear Threshold Model)을 제안했다.

독립 확산 모델은 SIR과 구조적으로 유사하다. 활성화된(감염된) 노드가 이웃 노드를 확률적으로 활성화(감염)시키고, 활성화 시도는 한 번만 가능하다(회복 후 면역). 탐욕 알고리즘이 (1-1/e) 근사 비율을 달성한다는 결과는 바이럴 마케팅 전략의 수학적 기반이 되었다.

그러나 중요한 차이점이 있다. 생물학적 전염은 비자발적이지만, 정보 확산은 자발적 선택을 포함한다. 사람들은 수동적으로 "감염"되는 것이 아니라, 정보의 내용, 출처의 신뢰성, 사회적 맥락을 고려하여 공유를 결정한다. 이 차이를 무시하면 모델의 예측력이 떨어진다.

## GNN 기반 전염병 예측: AI에서 역학으로

역학 -> AI 방향뿐 아니라, AI -> 역학 방향의 영향도 중요하다.

Kapoor et al.(2020)은 COVID-19 팬데믹 중 그래프 신경망(GNN)을 이용한 전염병 예측 모델을 제안했다. 전통적 SIR 모델은 파라미터(beta, gamma)를 데이터에서 추정해야 하고, 인구 이동이나 정책 변화에 대한 적응이 느리다. GNN 기반 접근은 **지역 간 이동 네트워크를 그래프로 표현**하고, 각 지역의 감염 동태를 노드 특성으로, 지역 간 상호작용을 엣지로 모델링한다.

이 방향의 연구는 전통적 역학 모델과 신경망의 결합인 **물리 정보 신경망**(Physics-Informed Neural Network, PINN) 접근으로도 확장되었다. **SIR 방정식의 구조를 신경망의 제약 조건으로 사용**하면서, 데이터에서 파라미터를 동시에 학습한다.

이것은 학문 간 영향의 양방향성을 보여주는 좋은 사례다. 역학의 수학적 모델이 네트워크 AI에 영감을 주었고, 다시 AI의 도구가 역학의 예측 능력을 높이는 순환이 형성된 것이다.

## 루머와 오정보 확산 모델링

전염병 모델의 또 다른 AI 응용은 루머와 오정보(misinformation)의 확산 모델링이다. Daley와 Kendall(1964)의 루머 확산 모델은 SIR 구조를 직접 차용했다.

- Ignorant(모르는 사람) = Susceptible
- Spreader(퍼뜨리는 사람) = Infected
- Stifler(더 이상 퍼뜨리지 않는 사람) = Recovered

현대 소셜 미디어에서의 오정보 확산 연구(Vosoughi, Roy, Aral 2018)는 이 모델을 확장하여, 오정보가 사실보다 더 빠르고 넓게 퍼지는 현상을 실증적으로 보였다. 이 연구는 확산의 속도가 **내용의 신기성(novelty)과 감정적 강도에 의존**한다는 것을 보여, SIR의 균일 전파율 가정이 정보 확산에서는 수정이 필요함을 드러냈다.

## 한계와 약점

- **균질 혼합 가정**: 기본 SIR 모델은 모든 개체가 동등한 확률로 접촉한다고 가정한다. 현실의 이질적 접촉 패턴을 반영하려면 네트워크 기반 모델이나 에이전트 기반 모델(ABM)이 필요하며, 이는 계산 복잡도를 크게 높인다.
- **파라미터 추정의 어려움**: beta와 gamma는 시간에 따라 변하고(사회적 거리두기, 치료법 발전 등), 정확한 추정이 어렵다. COVID-19 팬데믹에서 R_0 추정치가 연구마다 크게 달랐던 것이 이를 보여준다.
- **행동 변화 미반영**: 기본 SIR은 전염병의 확산이 사람들의 행동을 변화시키는 피드백 루프를 포함하지 않는다. 공포감에 의한 자발적 격리, 백신 기피 등의 행동적 요인은 별도 모델링이 필요하다.
- **정보 확산 비유의 한계**: 바이러스 전파와 정보 전파 사이의 비유는 유용하지만, 인간의 의사결정, 사회적 강화(social reinforcement), 정보 과포화(saturation) 등 정보 확산 고유의 메커니즘을 과소평가할 위험이 있다.
- **윤리적 우려**: 영향력 최대화 기법이 상업적 바이럴 마케팅뿐 아니라 정치적 선전이나 오정보 유포에 악용될 가능성이 있다.

## 용어 정리

SIR 모델(SIR model) - 인구를 감수성(S), 감염(I), 회복(R) 세 구획으로 나누어 전염병 확산을 기술하는 미분방정식 모델. Kermack & McKendrick(1927)

기본 재생산수(basic reproduction number, R_0) - 완전 감수성 인구에서 한 감염자가 평균적으로 감염시키는 사람 수. beta/gamma

집단 면역 임계치(herd immunity threshold) - 전파 차단에 필요한 면역 인구 비율. 1 - 1/R_0

균질 혼합(homogeneous mixing) - 인구 내 모든 개체가 동등한 확률로 접촉한다는 가정. 질량 작용 법칙에 기반

척도 없는 네트워크(scale-free network) - 노드의 연결 수 분포가 멱법칙을 따르는 네트워크. 소수의 허브가 다수의 연결을 가짐. Barabasi & Albert(1999)

영향력 최대화(influence maximization) - 네트워크에서 k개의 시드 노드를 선택하여 확산 범위를 최대화하는 조합 최적화 문제. NP-hard. Kempe et al.(2003)

독립 확산 모델(independent cascade model) - 활성화된 노드가 이웃 노드를 독립적으로 확률적으로 활성화하는 네트워크 확산 모델

그래프 신경망(graph neural network, GNN) - 그래프 구조의 데이터를 처리하는 신경망. 노드 특성과 엣지 관계를 동시에 학습

물리 정보 신경망(physics-informed neural network, PINN) - 물리 법칙(미분방정식)을 손실 함수의 제약 조건으로 사용하여 물리적 일관성을 보장하는 신경망

바이럴(viral) - 전염병의 확산처럼 빠르게 퍼지는 현상을 가리키는 비유적 표현. 역학 용어에서 마케팅/미디어 용어로 전용

---EN---
Epidemiological Modeling and Network Diffusion - How mathematical models of disease spread became the foundation for information propagation and network AI

## The Birth of Epidemic Mathematics

In 1927, Scottish biochemist William Ogilvy Kermack and military physician Anderson Gray McKendrick published a system of differential equations describing epidemic spread. The SIR (Susceptible-Infected-Recovered) model was a simple yet powerful framework that divided a population into three compartments to describe the dynamics of contagion.

Their key insight was that epidemic spread depends on a stochastic process of **encounters between infected and susceptible individuals**. By expressing this as continuous differential equations, epidemiology transitioned from qualitative observation to quantitative predictive science.

Anderson and May's (1991) "Infectious Diseases of Humans" extended this mathematical tradition, systematizing more sophisticated models incorporating age structure, incubation periods, waning immunity, and other factors.

## The SIR Model: The Mathematics of Spread

The SIR model's system of differential equations:

dS/dt = -beta * S * I
dI/dt = beta * S * I - gamma * I
dR/dt = gamma * I

Variables and parameters:

- S(t) = Susceptible. Proportion of people not yet infected who can be infected
- I(t) = Infected. Proportion currently infected who can transmit to others
- R(t) = Recovered. Proportion recovered with acquired immunity
- beta = Transmission rate. Rate at which contact between infected and susceptible leads to transmission
- gamma = Recovery rate. Rate at which infected individuals recover. 1/gamma is the mean infectious period

The first equation is the model's core. dS/dt = -beta * S * I states that the rate of decrease in susceptible population is proportional to the product of S and I. This assumption, borrowed from chemistry's **law of mass action**, is the homogeneous mixing assumption: "encounter frequency is **proportional to each group's size**."

## Basic Reproduction Number and Herd Immunity

The most important derived quantity from the SIR model is the basic reproduction number:

R_0 = beta / gamma

R_0 is the average number of people one infected individual infects in a fully susceptible population.

- R_0 > 1: epidemic spreads
- R_0 < 1: epidemic dies out
- R_0 = 1: boundary of endemic state

The **herd immunity threshold** is derived directly from R_0:

1 - 1/R_0

For example, if measles has R_0 of approximately 15, then 1 - 1/15 = 93.3% of the population must have immunity to block transmission. This mathematical result provides quantitative justification for vaccination policies.

## Confluence with Network Science

The SIR model's homogeneous mixing assumption has serious limitations. In real societies, contact patterns are far from uniform. Some people contact hundreds; most contact only a few.

Barabasi and Albert's (1999) scale-free network theory bridged this gap. In real social networks, the distribution of contacts (degree) follows a **power law**. A few **"hub" nodes** hold overwhelmingly many connections.

This discovery fundamentally changed epidemiological modeling. Pastor-Satorras and Vespignani (2001) showed that **epidemic thresholds can vanish** in scale-free networks. Due to hub nodes, epidemics can spread even at extremely low transmission rates -- a qualitatively different conclusion from SIR with homogeneous mixing.

## Information Diffusion: From Epidemiology to Social Networks

Applying epidemic spread models to the diffusion of information, trends, and behaviors was a natural extension. As viruses transmit through contact, ideas and information propagate through social connections. The term "viral" itself comes from this analogy.

Kempe, Kleinberg, and Tardos' (2003) influence maximization problem is a milestone in this connection. In a social network, which k "seed" users should be selected to maximize information spread? They proved this problem is NP-hard and proposed the **Independent Cascade Model** and **Linear Threshold Model** inspired by SIR.

The Independent Cascade Model is structurally similar to SIR. An activated (infected) node stochastically activates (infects) neighbor nodes, and activation attempts occur only once (immunity after recovery). The result that a greedy algorithm achieves a (1-1/e) approximation ratio became the mathematical foundation for viral marketing strategies.

However, a crucial difference exists. Biological contagion is involuntary, but information diffusion involves voluntary choice. People don't passively "get infected" -- they decide whether to share based on content, source credibility, and social context. Ignoring this difference reduces model predictive power.

## GNN-Based Epidemic Prediction: AI to Epidemiology

Beyond the epidemiology-to-AI direction, the AI-to-epidemiology direction is equally important.

Kapoor et al. (2020) proposed a Graph Neural Network (GNN) based epidemic prediction model during the COVID-19 pandemic. Traditional SIR models require estimating parameters (beta, gamma) from data and are slow to adapt to population mobility and policy changes. The GNN approach **represents inter-regional mobility networks as graphs**, modeling each region's infection dynamics as node features and inter-regional interactions as edges.

This research direction has extended to **Physics-Informed Neural Network** (PINN) approaches combining traditional epidemiological models with neural networks. **Using the SIR equations' structure as neural network constraints** while simultaneously learning parameters from data.

This is a good example of bidirectional interdisciplinary influence. Epidemiology's mathematical models inspired network AI, and AI tools in turn enhanced epidemiology's predictive capability -- a cycle of mutual enrichment.

## Rumor and Misinformation Spread Modeling

Another AI application of epidemic models is rumor and misinformation spread modeling. Daley and Kendall's (1964) rumor spread model directly borrowed the SIR structure:

- Ignorant (unaware people) = Susceptible
- Spreader (people spreading) = Infected
- Stifler (people who stopped spreading) = Recovered

Modern misinformation research on social media (Vosoughi, Roy, Aral 2018) extended this model, empirically showing that misinformation spreads faster and wider than facts. This research demonstrated that spread velocity depends on **content novelty and emotional intensity**, revealing that SIR's uniform transmission rate assumption needs modification for information diffusion.

## Limitations and Weaknesses

- **Homogeneous mixing assumption**: The basic SIR model assumes all individuals contact each other with equal probability. Reflecting heterogeneous real-world contact patterns requires network-based or agent-based models (ABM), which significantly increase computational complexity.
- **Parameter estimation difficulty**: beta and gamma change over time (social distancing, treatment advances, etc.) and are difficult to estimate accurately. The wide variation in R_0 estimates across studies during the COVID-19 pandemic illustrates this.
- **Behavioral change not captured**: Basic SIR does not include feedback loops where epidemic spread changes people's behavior. Voluntary isolation due to fear, vaccine hesitancy, and other behavioral factors require separate modeling.
- **Limits of the information diffusion analogy**: The analogy between viral and information transmission is useful but risks underestimating mechanisms unique to information diffusion: human decision-making, social reinforcement, and information saturation.
- **Ethical concerns**: Influence maximization techniques could be misused not only for commercial viral marketing but also for political propaganda or misinformation dissemination.

## Glossary

SIR model - a differential equation model describing epidemic spread by dividing a population into Susceptible (S), Infected (I), and Recovered (R) compartments; Kermack & McKendrick (1927)

Basic reproduction number (R_0) - the average number of people infected by one case in a fully susceptible population; beta/gamma

Herd immunity threshold - the proportion of immune population required to block transmission; 1 - 1/R_0

Homogeneous mixing - the assumption that all individuals in a population contact each other with equal probability; based on the law of mass action

Scale-free network - a network whose node degree distribution follows a power law; a few hubs hold the majority of connections; Barabasi & Albert (1999)

Influence maximization - a combinatorial optimization problem of selecting k seed nodes in a network to maximize spread; NP-hard; Kempe et al. (2003)

Independent cascade model - a network diffusion model where activated nodes independently and probabilistically activate neighbor nodes

Graph neural network (GNN) - a neural network that processes graph-structured data, simultaneously learning node features and edge relationships

Physics-informed neural network (PINN) - a neural network that uses physical laws (differential equations) as loss function constraints to ensure physical consistency

Viral - a metaphorical expression referring to phenomena that spread rapidly like epidemics; borrowed from epidemiological terminology into marketing and media
