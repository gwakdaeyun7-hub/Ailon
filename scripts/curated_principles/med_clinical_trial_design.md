---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 무작위 대조 시험, A/B 테스트, 인과 추론, 톰슨 샘플링, 다중 비교 보정, 적응적 시험, 통계적 검정력
keywords_en: randomized controlled trial, A/B testing, causal inference, Thompson sampling, multiple comparison correction, adaptive trial design, statistical power
---
Clinical Trial Design - 의학의 인과 추론 설계가 AI의 실험 방법론과 탐색-활용 알고리즘에 직접 영감을 준 원리

## 무작위 배정이라는 발명

1747년, 영국 해군 군의관 James Lind는 괴혈병에 걸린 선원 12명을 6개 그룹으로 나누어 각각 다른 치료법을 시험했다. 사이다, 황산, 식초, 해수, 오렌지와 레몬, 바크 페이스트. 오렌지와 레몬을 먹은 그룹만 회복했다. 통제 그룹의 존재, 동시 비교, 결과의 체계적 기록이라는 실험 원칙이 이미 이 원시적 시험에 담겨 있었다.

하지만 핵심 도약은 190년 뒤에 일어난다. Ronald A. Fisher(1935)가 "The Design of Experiments"에서 **무작위 배정**(randomization)의 이론적 기반을 확립했다. Fisher의 통찰은 단순하지만 깊다. 연구자가 아는 교란 변수(나이, 성별, 기저질환)는 의도적으로 균형을 맞출 수 있지만, **연구자가 모르는 교란 변수**는 어떤 의도적 설계로도 통제할 수 없다. 무작위 배정만이 알려진 것과 알려지지 않은 것 모두를 확률적으로 균등하게 분포시키는 유일한 방법이다.

1948년, 영국 의학연구위원회(MRC)의 스트렙토마이신 폐결핵 시험이 최초의 현대적 무작위 대조 시험(Randomized Controlled Trial, RCT)으로 인정받는다. 무작위 배정, 통제군, 맹검(blinding), 사전 등록된 프로토콜이 모두 갖춰진 이 시험이 이후 모든 임상시험의 원형이 되었다.

## 의학에서 디지털 실험으로

RCT의 구조가 AI와 테크 산업으로 이식된 경로는 두 갈래다.

**경로 1: A/B 테스트 -- RCT의 디지털 복제**

2000년대 초, 구글 엔지니어들이 웹페이지 변경의 효과를 측정하기 위해 RCT 구조를 그대로 차용했다. Ron Kohavi(마이크로소프트)가 이 분야를 체계화했고, Kohavi, Tang, Xu의 "Trustworthy Online Controlled Experiments"(2020)가 표준 참고서가 되었다. 핵심 대응 관계는 다음과 같다.

- 환자 --> **사용자**
- 처치군/대조군 --> **변형(variant) A/B**
- 치료법 --> **UI 변경, 알고리즘 변경, 가격 변경**
- 임상적 결과(생존율, 증상 완화) --> **비즈니스 메트릭(전환율, 클릭률, 체류 시간)**
- 무작위 배정 --> **사용자 해시 기반 그룹 할당**
- 맹검 --> **사용자가 실험 중인지 인지하지 못함**

이 대응에서 통계적 검정 도구(t-검정, 유의수준, 검정력 계산)까지 그대로 이식되었다. Google, Meta, Netflix, Microsoft가 연간 수만 건의 A/B 테스트를 실행한다.

구체적 사례를 보면 감이 온다. 2009년, 구글은 검색 결과 링크의 파란색을 41가지 미세한 차이로 A/B 테스트했다. 수억 명의 사용자를 변형별로 무작위 배정하고 클릭률을 비교한 결과, 최적의 파란색 하나가 연간 2억 달러의 추가 수익을 만들어냈다. 색상 하나의 차이를 감지하려면 거대한 표본이 필요하고, 그 표본을 RCT 구조로 통제해야만 "이 파란색이 진짜 더 나은가"라는 인과적 질문에 답할 수 있다.

**경로 2: Thompson Sampling -- 임상시험의 윤리적 딜레마에서 태어난 알고리즘**

William R. Thompson(1933)은 두 가지 치료법 중 어느 것이 효과적인지 모르는 상황에서, 시험 기간 동안 열등한 치료에 환자를 계속 배정하는 것이 윤리적으로 문제라고 보았다. 그의 해법은 각 치료법의 효과에 대한 **사후 확률**(posterior)에 비례하여 환자를 배정하는 것이었다. 이 아이디어가 80년 뒤에 **다중 슬롯머신 문제**(Multi-Armed Bandit, MAB)의 핵심 알고리즘으로 부활하여, 추천 시스템과 광고 최적화의 기반이 되었다.

## 핵심 수학적 구조

**1. 평균 처치 효과(Average Treatment Effect)**

ATE = E[Y(1)] - E[Y(0)]

Y(1)은 처치를 받았을 때의 결과, Y(0)은 받지 않았을 때의 결과다. 동일한 개체가 동시에 처치를 받으면서 받지 않을 수는 없다. 이것이 인과 추론의 근본 문제(fundamental problem of causal inference)다. 무작위 배정은 두 그룹의 기대값을 비교 가능하게 만들어 이 문제를 우회한다.

**2. 표본 크기 결정 공식**

n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

z_{alpha/2}는 유의수준의 임계값(alpha = 0.05이면 1.96), z_beta는 검정력의 임계값(검정력 0.8이면 0.84), sigma^2는 결과 변수의 분산, delta는 감지하려는 최소 효과 크기다. 핵심 직관은 이렇다. delta가 작아질수록 n은 delta^2에 반비례하여 급격히 커지고, sigma^2가 커질수록 n도 커진다. 전환율 0.5%포인트 차이를 감지하려면 그룹당 약 18,000명이 필요하지만, 0.1%포인트 차이를 감지하려면 25배인 약 456,000명이 필요해진다. 이 공식은 A/B 테스트의 표본 크기 계산에서도 그대로 사용된다.

**3. Thompson Sampling의 작동**

1. 각 선택지(arm)의 보상에 대한 사후 분포를 유지한다. 이진 결과(클릭/미클릭)에는 Beta 분포가 자연스러운 선택이다. Beta(alpha, beta)에서 alpha는 성공 횟수, beta는 실패 횟수를 누적한다.
2. 각 사후 분포에서 하나씩 랜덤 샘플을 뽑는다.
3. 가장 높은 샘플을 가진 선택지를 고르고 보상을 관찰한다.
4. 관찰된 보상으로 사후 분포를 갱신한다. 성공이면 alpha + 1, 실패면 beta + 1.

이것을 공간적으로 상상하면 이렇다. 각 선택지는 종 모양의 확률 분포를 가지고 있다. 데이터가 적은 선택지는 종이 넓고 납작해서(불확실성이 크므로) 가끔 아주 높은 값이 뽑힐 수 있다 -- 이것이 **탐색**이다. 데이터가 충분히 쌓인 좋은 선택지는 종이 좁고 높아서 안정적으로 높은 값이 뽑힌다 -- 이것이 **활용**이다. 분포의 모양 자체가 탐색과 활용의 균형을 자동으로 결정한다. 아무도 "이 선택지가 최선이다"라고 명시적으로 판단하지 않아도, 분포가 데이터에 맞춰 좁아지면서 좋은 선택지가 자연스럽게 더 많이 선택되는 자기 교정 구조다.

## 고정 설계 vs 적응적 설계: 핵심 트레이드오프

RCT의 가장 근본적인 트레이드오프는 **내적 타당성과 효율성** 사이에 있다.

고전적 고정 설계 RCT는 시험 시작 전에 표본 크기, 처치군, 종점(endpoint)을 모두 확정하고 끝까지 변경하지 않는다. 엄격하지만 비효율적이다. 시험 도중 한 처치가 명백히 열등하다는 증거가 쌓여도, 프로토콜에 따라 환자를 계속 배정해야 한다.

적응적 설계(adaptive design)는 중간 분석(interim analysis)에서 축적된 데이터를 보고 설계를 조정한다. 표본 크기를 늘리거나, 열등한 처치군을 조기 중단하거나, 유망한 하위 집단에 집중할 수 있다. 효율적이지만, 중간에 설계가 변하면 1종 오류 확률(거짓 양성)이 증가할 위험이 있어, 이를 통계적으로 보정하는 복잡한 방법론이 필요하다.

이 트레이드오프는 AI에서도 반복된다. 하이퍼파라미터 고정 후 학습(고정 설계)과, 학습 도중 learning rate나 구조를 조정하는 전략(적응적 설계)이 같은 긴장 관계에 놓여 있다.

## 다중 비교 문제: 의학의 엄격함이 AI에 필요한 이유

임상시험에서 여러 결과 변수나 하위 그룹을 동시에 검정하면 **1종 오류(거짓 양성) 확률이 급격히 증가**한다. 구체적으로 보면, 20개 독립 검정을 유의수준 0.05로 수행하면, 하나 이상에서 거짓 양성이 나올 확률은 1 - (1-0.05)^20 = 64%다. 검정이 100개면 99.4%로 사실상 확실하다.

의학은 이 문제를 수십 년간 다뤄왔다. Bonferroni 보정(유의수준을 검정 횟수로 나눔), Holm-Bonferroni(순위 기반 단계적 보정), Benjamini-Hochberg의 FDR(False Discovery Rate) 제어가 표준 방법이다.

AI에서 이 문제는 **하이퍼파라미터 탐색에서 직접** 나타난다. 예를 들어 학습률, 배치 크기, 드롭아웃 비율 등 200가지 하이퍼파라미터 조합을 시도하고 "가장 좋은" 검증 정확도를 선택한다고 하자. 검증 세트 정확도가 200개 조합에서 각각 72%에서 79% 사이에 분포한다면, 최고값 79%가 진짜 그 조합이 뛰어나서인지, 200번 시도 중 우연히 검증 세트에 잘 맞았을 뿐인지 구분할 수 없다. 이것은 200번의 검정에서 우연히 좋은 결과를 고르는 것과 구조적으로 동일하다. 실제로 그 "최고" 조합을 새로운 테스트 세트에 적용하면 성능이 2-3% 하락하는 경우가 흔하다. 모델 벤치마크에서 수십 개 태스크를 보고하면서 가장 좋은 결과만 강조하는 것도 같은 함정이다. 엄밀한 AI 연구는 임상시험의 이 교훈을 수용하여 보정을 적용하지만, 아직 많은 연구가 이를 간과한다.

## 현대 AI 기법과의 연결

임상시험 설계가 AI에 미친 영향은 여러 층위에서 나타난다. 다만 각 연결의 성격은 다르다.

**직접적 영감:**

- **A/B 테스트**: RCT의 구조(무작위 배정, 통제군, 가설 검정)를 디지털 환경에 그대로 이식한 가장 직접적인 사례다. 통계적 검정 방법론까지 동일하게 사용된다.
- **Thompson Sampling**: Thompson(1933)이 임상시험의 윤리적 배정 문제를 위해 고안한 알고리즘이 현대 MAB 문제의 핵심 전략으로 직접 부활했다. Chapelle & Li(2011)가 온라인 광고 최적화에 적용하면서 실용적 가치가 재확인되었다. 현대 추천 시스템, 동적 가격 책정, 뉴스 피드 개인화에서 epsilon-greedy, UCB(Upper Confidence Bound)와 함께 핵심 MAB 전략으로 사용된다.
- **다중 비교 보정**: Bonferroni, FDR 등 임상시험의 다중 비교 보정 방법론이 하이퍼파라미터 탐색, 모델 비교, 특징 선택(feature selection)에서 직접 사용된다.

**구조적 유사성 (독립적으로 같은 문제에 수렴한 경우):**

- **적응적 시험과 베이즈 최적화**: 적응적 시험 설계(중간 데이터 기반 처치군 조정)와 AI의 베이즈 최적화(관찰 결과 기반 다음 탐색점 결정)는 모두 "제한된 자원 하의 순차적 학습"이라는 같은 구조적 문제에 대한 수렴적 해법이다. 의학과 AI가 독립적으로 도달한 유사 구조이며, 한쪽이 다른 쪽에서 직접 영감을 받은 것은 아니다.
- **교차 검증과 임상시험의 분리 설계**: 학습 데이터와 검증 데이터를 분리하는 교차 검증(cross-validation)의 논리는 처치군과 대조군을 분리하는 RCT의 논리와 구조적으로 평행한다. 둘 다 "평가 대상과 평가 기준을 오염시키지 않는다"는 같은 원칙을 공유하지만, 독립적으로 발전했다.

## 한계와 약점

- **윤리적 제약으로 인한 적용 범위 한계**: 모든 인과적 질문을 RCT로 답할 수 있는 것은 아니다. 흡연의 폐암 유발 효과를 RCT로 연구하는 것은 윤리적으로 불가능하다. 테크 A/B 테스트에서도 사용자에게 의도적으로 나쁜 경험을 배정하는 것의 윤리성이 논쟁된다.
- **외적 타당성의 한계**: RCT의 내적 타당성(통제된 환경에서의 인과 관계)은 높지만, 결과가 실제 환경에 일반화되는지는 별개 문제다. 엄격히 통제된 임상시험의 효과가 실제 진료 환경에서 재현되지 않는 경우가 빈번하며, A/B 테스트 결과도 테스트 기간의 신기 효과(novelty effect)로 장기 효과와 괴리될 수 있다.
- **네트워크 효과와 SUTVA 위반**: RCT는 한 참가자의 처치가 다른 참가자에게 영향을 미치지 않는다고 가정한다(SUTVA: Stable Unit Treatment Value Assumption). 소셜 플랫폼의 A/B 테스트에서는 사용자 간 상호작용 때문에 이 가정이 깨지며, 처치 효과가 왜곡된다.
- **p-해킹과 결과 조작**: 유의한 결과가 나올 때까지 분석 방법을 조정하는 p-해킹(p-hacking)은 임상시험과 A/B 테스트 모두의 신뢰성을 위협한다. 사전 등록(pre-registration)이 이를 방지하는 표준 방법이지만, 테크 업계에서는 사전 등록 관행이 아직 정착되지 않았다.

## 용어 정리

무작위 대조 시험(randomized controlled trial, RCT) - 참가자를 처치군과 대조군에 무작위로 배정하여 처치의 인과 효과를 추정하는 실험 설계

평균 처치 효과(average treatment effect, ATE) - 처치를 받았을 때와 받지 않았을 때의 결과 차이의 기대값. E[Y(1)] - E[Y(0)]

교란 변수(confounder) - 처치와 결과 모두에 영향을 미쳐 인과 관계 추정을 왜곡하는 제3의 변수. 무작위 배정의 핵심 목적이 교란 변수의 균등 분포

통계적 검정력(statistical power) - 실제로 효과가 있을 때 이를 탐지할 확률. 1 - beta로 표현되며, 관례적으로 0.8 이상을 요구

맹검(blinding) - 참가자, 연구자, 또는 양쪽 모두가 배정된 그룹을 모르도록 하여 기대 편향을 방지하는 설계 요소. 단일 맹검은 참가자만, 이중 맹검은 양쪽 모두 모름

Thompson Sampling - 각 선택지의 보상 사후 분포에서 샘플을 뽑아 최고값을 가진 선택지를 고르는 MAB 알고리즘. Thompson(1933)이 임상시험 배정을 위해 고안

다중 슬롯머신 문제(multi-armed bandit, MAB) - 여러 선택지 중 어느 것이 최선인지 모를 때, 탐색과 활용을 균형 잡으며 순차적으로 선택하는 문제

Bonferroni 보정(Bonferroni correction) - 다중 검정에서 유의수준을 검정 횟수로 나누어 1종 오류를 보정하는 보수적 방법. 20개 검정이면 유의수준을 0.05/20 = 0.0025로 낮춤

적응적 시험 설계(adaptive trial design) - 중간 데이터를 분석하여 시험 진행 중에 표본 크기, 처치군, 종점 등을 조정할 수 있는 임상시험 방법론

SUTVA(Stable Unit Treatment Value Assumption) - 한 참가자의 처치가 다른 참가자의 결과에 영향을 미치지 않는다는 가정. 네트워크 효과가 있는 환경에서 위반됨

---EN---
Clinical Trial Design - How medicine's causal inference framework directly inspired AI's experimentation methods and exploration-exploitation algorithms

## The Invention of Randomization

In 1747, British naval surgeon James Lind divided 12 sailors with scurvy into 6 groups, testing different treatments: cider, sulfuric acid, vinegar, seawater, oranges and lemons, and bark paste. Only the group given oranges and lemons recovered. The experimental principles of control groups, simultaneous comparison, and systematic recording of results were already embedded in this primitive trial.

But the key leap came 190 years later. Ronald A. Fisher (1935) established the theoretical foundation for **randomization** in "The Design of Experiments." Fisher's insight was simple yet profound. Known confounders (age, sex, pre-existing conditions) can be deliberately balanced, but **unknown confounders** cannot be controlled by any intentional design. Randomization is the only method that probabilistically distributes both the known and the unknown evenly across groups.

In 1948, the Medical Research Council's (MRC) streptomycin trial for pulmonary tuberculosis became recognized as the first modern Randomized Controlled Trial (RCT). Featuring randomization, control groups, blinding, and a pre-registered protocol, this trial became the archetype for all subsequent clinical trials.

## From Medicine to Digital Experimentation

RCT's structure was transplanted into AI and the tech industry along two paths.

**Path 1: A/B Testing -- A Digital Replica of the RCT**

In the early 2000s, Google engineers directly borrowed RCT structure to measure the effects of webpage changes. Ron Kohavi (Microsoft) systematized the field, and Kohavi, Tang, and Xu's "Trustworthy Online Controlled Experiments" (2020) became the standard reference. The key correspondences are:

- Patients --> **Users**
- Treatment/control groups --> **Variants A/B**
- Therapy --> **UI changes, algorithm changes, pricing changes**
- Clinical outcomes (survival, symptom relief) --> **Business metrics (conversion, click-through, engagement)**
- Randomization --> **User hash-based group assignment**
- Blinding --> **Users unaware they are in an experiment**

Even the statistical testing tools (t-tests, significance levels, power calculations) were transplanted identically. Google, Meta, Netflix, and Microsoft run tens of thousands of A/B tests annually.

A concrete example illustrates this. In 2009, Google A/B tested 41 subtle variations of the blue color used for search result links. By randomly assigning hundreds of millions of users to each variant and comparing click-through rates, they found that a single optimal shade of blue generated an additional $200 million in annual revenue. Detecting the difference a single color makes requires enormous sample sizes, and only the RCT structure of controlled randomization can answer the causal question: "Is this blue actually better?"

**Path 2: Thompson Sampling -- An Algorithm Born from the Ethical Dilemma of Clinical Trials**

William R. Thompson (1933) saw an ethical problem in continuing to assign patients to an inferior treatment when it was unknown which of two treatments was more effective. His solution was to assign patients in proportion to each treatment's **posterior probability** of being effective. This idea was resurrected 80 years later as a core algorithm for the **Multi-Armed Bandit** (MAB) problem, becoming foundational for recommendation systems and ad optimization.

## Core Mathematical Structures

**1. Average Treatment Effect (ATE)**

ATE = E[Y(1)] - E[Y(0)]

Y(1) is the outcome under treatment, Y(0) the outcome without. The same individual cannot simultaneously receive and not receive treatment. This is the fundamental problem of causal inference. Randomization makes the two groups' expected values comparable, sidestepping this problem.

**2. Sample Size Determination Formula**

n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

z_{alpha/2} is the critical value for significance level (conventionally 1.96 for alpha = 0.05), z_beta is the critical value for power (0.84 for power = 0.8), sigma^2 is the outcome variance, and delta is the minimum detectable effect size. Following this formula to its extremes reveals the intuition. As delta shrinks (detecting finer differences), n grows inversely with delta^2 -- detecting a 1% conversion rate difference requires 100 times fewer samples than detecting a 0.1% difference. As sigma^2 grows (noisier outcomes), n grows proportionally. Noisier environments demand more data. This formula is used identically in A/B test sample size calculations.

Let us work through a concrete example. Suppose a website's current conversion rate is 3.0%, and we want to test whether a new design raises it to 3.5%. With alpha = 0.05 and power = 0.8:

- delta = 0.035 - 0.030 = 0.005
- sigma^2 ≈ p(1-p) ≈ 0.03 * 0.97 = 0.0291 (binomial variance)
- n = (1.96 + 0.84)^2 * 2 * 0.0291 / 0.005^2 = 7.84 * 0.0582 / 0.000025 ≈ 18,253

Roughly 18,253 per group, or about 36,506 total. If instead we wanted to detect a 0.1 percentage point difference (3.0% vs 3.1%), n increases 25-fold to approximately 456,000 per group. This is the numerical reality of the principle that detecting finer differences demands vastly larger samples.

**3. How Thompson Sampling Works**

1. Maintain a posterior distribution for each arm's reward. For binary outcomes (click/no-click), the Beta distribution is a natural choice. Beta(alpha, beta) accumulates alpha successes and beta failures.
2. Draw one random sample from each posterior distribution.
3. Select the arm with the highest sample and observe the reward.
4. Update the posterior with the observed reward: success increments alpha by 1, failure increments beta by 1.

To visualize this spatially: each arm has a bell-shaped probability distribution. An arm with little data has a wide, flat bell (high uncertainty), so occasionally a very high value can be drawn -- this is **exploration**. An arm with abundant data and good results has a narrow, tall bell that consistently produces high values -- this is **exploitation**. The shape of the distribution itself automatically determines the exploration-exploitation balance.

Let us trace this with concrete numbers. Consider a 3-armed slot machine with true win rates A=0.3, B=0.5, C=0.7. We do not know these values.

- **Start**: all three arms begin with Beta(1,1) = uniform distribution. Any value can be drawn.
- **After 5 rounds**: arm A pulled 3 times, 1 success --> Beta(2,3), mean 0.40. Arm B pulled once, 1 success --> Beta(2,1), mean 0.67. Arm C pulled once, 0 successes --> Beta(1,2), mean 0.33.
- At this point arm B looks best, but with only 1 data point its distribution is wide. Arm C unluckily failed on its first try and looks worst, yet its wide distribution still allows high samples to be drawn.
- **After 20 rounds**: arm C has been repeatedly selected and reaches Beta(8,4). Mean 0.67, distribution narrow, consistently producing high samples. Arm A sits at Beta(3,5) with mean 0.38, naturally selected less often.
- The key: nobody explicitly decides "C is best." The distributions narrow themselves as data accumulates, and good arms are naturally selected more often -- a self-correcting structure.

## Fixed vs. Adaptive Design: The Core Tradeoff

The most fundamental tradeoff in RCTs lies between **internal validity and efficiency**.

A classical fixed-design RCT locks in sample size, treatment arms, and endpoints before the trial begins and changes nothing until the end. Rigorous but inefficient. Even when evidence accumulates mid-trial that one treatment is clearly inferior, the protocol requires continued patient assignment.

Adaptive design adjusts the design based on accumulated data at interim analyses. Sample sizes can be increased, inferior treatment arms terminated early, or promising subgroups prioritized. Efficient but risky -- mid-trial design changes can inflate the Type I error rate (false positives), requiring sophisticated statistical corrections.

This tradeoff recurs in AI. Training with fixed hyperparameters (fixed design) versus adjusting learning rates or architecture during training (adaptive design) occupies the same tension.

## The Multiple Comparison Problem: Why Medicine's Rigor Is Needed in AI

Simultaneously testing multiple outcome variables or subgroups in clinical trials causes the **Type I error (false positive) rate to increase sharply**. Concretely, performing 20 independent tests at significance level 0.05, the probability of at least one false positive is 1 - (1-0.05)^20 = 64%. With 100 tests, it reaches 99.4% -- virtually certain.

Medicine has grappled with this for decades. Bonferroni correction (dividing significance level by number of tests), Holm-Bonferroni (rank-based stepwise correction), and Benjamini-Hochberg's FDR (False Discovery Rate) control are standard solutions.

In AI, this problem **directly appears in hyperparameter search**. Suppose you try 200 combinations of learning rate, batch size, and dropout rate, then select the "best" validation accuracy. If validation accuracy across the 200 combinations ranges from 72% to 79%, there is no way to tell whether the top-scoring 79% reflects genuine superiority of that combination or simply a lucky fit to the validation set out of 200 attempts. This is structurally identical to picking a coincidentally good result from 200 tests. In practice, applying that "best" combination to a fresh test set commonly drops performance by 2-3%. Reporting dozens of benchmark tasks and highlighting only the best results is the same trap. Rigorous AI research accepts this lesson from clinical trials and applies corrections, but many studies still overlook it.

## Connections to Modern AI

Clinical trial design's influence on AI manifests at multiple levels. However, the nature of each connection differs.

**Direct inspiration:**

- **A/B Testing**: The most direct case of transplanting RCT structure (randomization, control groups, hypothesis testing) into a digital environment. Even the statistical testing methodology is used identically.
- **Thompson Sampling**: The algorithm Thompson (1933) designed for ethical clinical trial allocation was directly revived as a core strategy for the modern MAB problem. Chapelle & Li (2011) reconfirmed its practical value by applying it to online ad optimization. It is now used alongside epsilon-greedy and UCB (Upper Confidence Bound) as a core MAB strategy in recommendation systems, dynamic pricing, and news feed personalization.
- **Multiple comparison correction**: Clinical trial methods like Bonferroni and FDR correction are directly used in hyperparameter search, model comparison, and feature selection.

**Structural similarity (independent convergence on the same problem):**

- **Adaptive trials and Bayesian optimization**: Adaptive trial design (adjusting treatment arms based on interim data) and AI's Bayesian optimization (determining the next exploration point based on observed results) are both convergent solutions to the same structural problem of "sequential learning under resource constraints." Medicine and AI arrived at similar structures independently rather than one inspiring the other.
- **Cross-validation and RCT's separation design**: The logic of separating training and validation data in cross-validation parallels the logic of separating treatment and control groups in RCTs. Both share the principle of "not contaminating what is being evaluated with the evaluation criterion," but they developed independently.

## Limitations and Weaknesses

- **Ethical constraints limit applicability**: Not all causal questions can be answered with RCTs. Studying smoking's cancer-causing effect via RCT is ethically impossible. In tech A/B testing, the ethics of deliberately assigning poor experiences to users remains debated.
- **External validity limitations**: RCTs have high internal validity (causal relationships in controlled settings), but whether results generalize to real environments is a separate question. Clinical trial effects frequently fail to replicate in actual practice, and A/B test results can diverge from long-term effects due to novelty effects during the test period.
- **Network effects and SUTVA violation**: RCTs assume that one participant's treatment does not affect another's outcome (SUTVA: Stable Unit Treatment Value Assumption). In social platform A/B tests, user interactions violate this assumption, distorting treatment effects.
- **p-hacking and result manipulation**: The practice of adjusting analysis methods until significant results appear (p-hacking) threatens both clinical trials and A/B tests. Pre-registration is the standard countermeasure, but the practice has not yet taken root in the tech industry.

## Glossary

Randomized controlled trial (RCT) - an experimental design that randomly assigns participants to treatment and control groups to estimate the causal effect of treatment

Average treatment effect (ATE) - the expected difference in outcomes between receiving and not receiving treatment; E[Y(1)] - E[Y(0)]

Confounder - a third variable that influences both treatment and outcome, distorting causal inference; the core purpose of randomization is even distribution of confounders

Statistical power - the probability of detecting an effect when it truly exists; expressed as 1 - beta, conventionally requiring 0.8 or above

Blinding - a design element preventing participants, researchers, or both from knowing group assignments to prevent expectation bias; single-blind affects participants only, double-blind affects both

Thompson Sampling - a MAB algorithm that selects the arm with the highest sample drawn from each arm's reward posterior distribution; designed by Thompson (1933) for clinical trial allocation

Multi-armed bandit (MAB) - the problem of sequentially selecting among multiple options while balancing exploration and exploitation when the best option is unknown

Bonferroni correction - a conservative method for controlling Type I error in multiple testing by dividing the significance level by the number of tests; with 20 tests, the threshold drops from 0.05 to 0.05/20 = 0.0025

Adaptive trial design - a clinical trial methodology allowing adjustment of sample sizes, treatment arms, and endpoints during the trial based on interim data analysis

SUTVA (Stable Unit Treatment Value Assumption) - the assumption that one participant's treatment does not affect another participant's outcome; violated in environments with network effects
