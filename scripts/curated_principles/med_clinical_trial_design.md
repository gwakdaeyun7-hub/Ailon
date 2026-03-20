---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 무작위 대조 시험, A/B 테스트, 인과 추론, 톰슨 샘플링, 다중 비교 보정, 적응적 시험, 통계적 검정력
keywords_en: randomized controlled trial, A/B testing, causal inference, Thompson sampling, multiple comparison correction, adaptive trial design, statistical power
---
Clinical Trial Design - 의학의 인과 추론 설계가 AI의 실험 방법론과 탐색-활용 알고리즘에 직접 영감을 준 원리

## 무작위 배정이라는 발명

1747년, 영국 해군 군의관 James Lind는 괴혈병에 걸린 선원 12명을 6개 그룹으로 나누어 각각 다른 치료법을 시험했다. 사이다, 묽은 황산, 식초, 해수, 오렌지와 레몬, 향신료 혼합물. 오렌지와 레몬을 먹은 그룹만 회복했다. 비교 그룹의 체계적 구성, 동시 비교, 결과의 체계적 기록이라는 실험 원칙이 이미 이 원시적 시험에 담겨 있었다.

하지만 핵심 도약은 거의 2세기 뒤에 일어난다. Ronald A. Fisher(1935)가 "The Design of Experiments"에서 **무작위 배정**(randomization)의 이론적 기반을 확립했다. Fisher의 통찰은 단순하지만 깊다. 연구자가 아는 교란 변수(나이, 성별, 기저질환)는 의도적으로 균형을 맞출 수 있지만, **연구자가 모르는 교란 변수**는 어떤 의도적 설계로도 통제할 수 없다. 무작위 배정만이 알려진 것과 알려지지 않은 것 모두를 확률적으로 균등하게 분포시키는 유일한 방법이다. Austin Bradford Hill은 1948년 스트렙토마이신 폐결핵 시험에서 Fisher의 무작위 배정을 실제 환자에게 최초로 적용하여 현대적 RCT를 확립했다.

비유하면, 교란 변수는 저울의 보이지 않는 기울기와 같다. 어디가 기울었는지 몰라도, 충분한 동전 던지기가 양쪽을 평균적으로 수평에 가깝게 만든다.

## 의학에서 디지털 실험으로

RCT의 구조는 테크 산업에도 이식되었다.

**A/B 테스트 -- RCT의 디지털 복제**

2000년대 초, 구글 엔지니어들이 웹페이지 변경의 효과를 측정하기 위해 RCT와 동일한 실험 설계 원리를 적용했다. Ron Kohavi(마이크로소프트)가 이 분야를 체계화했고, Kohavi, Tang, Xu의 "Trustworthy Online Controlled Experiments"(2020)가 표준 참고서가 되었다. 핵심 대응 관계는 다음과 같다.

- 환자 --> **사용자**
- 처치군/대조군 --> **변형(variant) A/B**
- 치료법 --> **UI 변경, 알고리즘 변경, 가격 변경**
- 임상적 결과(생존율, 증상 완화) --> **비즈니스 메트릭(전환율, 클릭률, 체류 시간)**
- 무작위 배정 --> **사용자 해시 기반 그룹 할당**
- 맹검 --> **사용자가 실험 중인지 인지하지 못함**

통계적 검정 도구(t-검정, 유의수준, 검정력 계산)까지 이식되어, Google, Meta, Netflix 등이 연간 수만 건의 A/B 테스트를 실행한다.

## 핵심 수학적 구조

**1. 평균 처치 효과(Average Treatment Effect)**

ATE = E[Y(1)] - E[Y(0)]

Y(1)은 처치를 받았을 때의 결과, Y(0)은 받지 않았을 때의 결과다. 동일 개체가 동시에 양쪽 상태일 수 없으므로, 개인 수준의 인과 효과는 직접 관찰 불가능하다(인과 추론의 근본 문제). 무작위 배정은 두 그룹의 기대값을 비교 가능하게 만들어 이를 우회한다.

**2. 표본 크기 결정 공식**

n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

여기서 alpha는 1종 오류 허용 확률(보통 0.05), beta는 2종 오류 허용 확률(1-beta가 검정력), sigma는 결과의 표준편차, delta는 탐지하려는 최소 효과 크기다.

## 고정 설계 vs 적응적 설계: 핵심 트레이드오프

RCT의 가장 근본적인 트레이드오프는 **내적 타당성과 효율성** 사이에 있다.

고전적 고정 설계 RCT는 시험 시작 전에 표본 크기, 처치군, 종점(endpoint)을 확정하고 끝까지 변경하지 않는다. 시험 도중 한 처치가 명백히 열등해도 프로토콜대로 환자를 계속 배정해야 한다.

적응적 설계(adaptive design)는 중간 분석(interim analysis)에서 축적된 데이터를 보고 설계를 조정한다. 열등한 처치군의 조기 중단, 유망한 하위 집단 집중 등이 가능하지만, 설계 변경이 1종 오류(거짓 양성) 확률을 높일 위험이 있어 통계적 보정이 필수다.

이 트레이드오프는 AI에서도 반복된다. 하이퍼파라미터 고정 학습과, 학습 도중 learning rate를 조정하는 적응적 전략이 같은 긴장 관계에 있다.

## 다중 비교 문제: 의학의 엄격함이 AI에 필요한 이유

임상시험에서 여러 결과 변수나 하위 그룹을 동시에 검정하면 **1종 오류(거짓 양성) 확률이 급격히 증가**한다. 구체적으로 보면, 20개 독립 검정을 유의수준 0.05로 수행하면, 하나 이상에서 거짓 양성이 나올 확률은 1 - (1-0.05)^20 = 64%다. 검정이 100개면 99.4%로 사실상 확실하다. 20개 방에서 범인을 찾을 때, 문이 많을수록 무고한 사람을 오인할 확률이 높다.

의학은 이 문제를 수십 년간 다뤄왔다. Bonferroni 보정(유의수준을 검정 횟수로 나눔), Holm-Bonferroni(순위 기반 단계적 보정), Benjamini-Hochberg의 FDR(False Discovery Rate) 제어가 표준 방법이다.

## 현대 AI 기법과의 연결

임상시험 설계가 AI에 미친 영향은 여러 층위에서 나타난다. 다만 각 연결의 성격은 다르다.

**직접적 영감:**

- **A/B 테스트**: RCT의 구조(무작위 배정, 대조군, 가설 검정)를 디지털 환경에 이식한 가장 직접적인 사례다.
- **Thompson Sampling**: Thompson(1933)이 두 미지 확률 비교를 위해 제안한 이 알고리즘은 수십 년간 잊혔다가, Chapelle & Li(2011)와 Agrawal & Goyal(2012)가 온라인 광고와 이론 분석을 통해 MAB 전략으로 재발견했다. 임상시험에서는 Bayesian 적응적 배정으로 병행 응용되었다. 현재 추천·가격·뉴스 개인화에서 epsilon-greedy, UCB와 함께 핵심 MAB 전략이다.
- **다중 비교 보정**: Bonferroni, FDR 등 임상시험의 다중 비교 보정 방법론이 하이퍼파라미터 탐색, 모델 비교, 특징 선택(feature selection)에서 직접 사용된다.

**구조적 유사성 (독립적으로 같은 문제에 수렴한 경우):**

- **교차 검증과 대조 실험**: k-fold 교차 검증은 데이터를 k개로 나누어 매번 다른 부분을 테스트 세트로 사용한다. RCT와 직접적 역사적 연결은 없지만, "훈련과 평가를 분리한다"는 동일한 직관을 공유한다.
- **조기 종료와 적응적 시험**: 적응적 시험의 중간 중단은 Wald(1945) 순차 분석에서 직접 발전했다. ML 조기 종료는 독립적으로 과적합 방지에서 발전했지만, 둘 다 최적 중단 문제를 다룬다.

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

Thompson Sampling - 각 선택지의 보상 사후 분포에서 샘플을 뽑아 최고값을 가진 선택지를 고르는 MAB 알고리즘. Thompson(1933)이 제안

다중 슬롯머신 문제(multi-armed bandit, MAB) - 여러 선택지 중 어느 것이 최선인지 모를 때, 탐색과 활용을 균형 잡으며 순차적으로 선택하는 문제

Bonferroni 보정(Bonferroni correction) - 다중 검정에서 유의수준을 검정 횟수로 나누어 1종 오류를 보정하는 보수적 방법. 20개 검정이면 유의수준을 0.05/20 = 0.0025로 낮춤
---EN---
Clinical Trial Design - How medicine's causal inference framework directly inspired AI's experimentation methods and exploration-exploitation algorithms

## The Invention of Randomization

In 1747, British naval surgeon James Lind divided 12 sailors with scurvy into 6 groups, testing different treatments: cider, dilute sulfuric acid, vinegar, seawater, oranges and lemons, and a spice electuary. Only the group given oranges and lemons recovered. The experimental principles of systematic organization of comparison groups, simultaneous comparison, and systematic recording of results were already embedded in this primitive trial.

But the key leap came nearly two centuries later. Ronald A. Fisher (1935) established the theoretical foundation for **randomization** in "The Design of Experiments." Fisher's insight was simple yet profound. Known confounders (age, sex, pre-existing conditions) can be deliberately balanced, but **unknown confounders** cannot be controlled by any intentional design. Randomization is the only method that probabilistically distributes both the known and the unknown evenly across groups. Austin Bradford Hill first applied Fisher's randomization to actual patients in the 1948 streptomycin tuberculosis trial, establishing the modern RCT.

By analogy, confounders are like invisible tilts in a scale. Even without knowing which way it leans, enough coin flips bring both sides approximately level on average.

## From Medicine to Digital Experimentation

RCT's structure was also transplanted into the tech industry.

**A/B Testing -- A Digital Replica of the RCT**

In the early 2000s, Google engineers applied the same experimental design principles as the RCT to measure the effects of webpage changes. Ron Kohavi (Microsoft) systematized the field, and Kohavi, Tang, and Xu's "Trustworthy Online Controlled Experiments" (2020) became the standard reference. The key correspondences are:

- Patients --> **Users**
- Treatment/control groups --> **Variants A/B**
- Therapy --> **UI changes, algorithm changes, pricing changes**
- Clinical outcomes (survival, symptom relief) --> **Business metrics (conversion, click-through, engagement)**
- Randomization --> **User hash-based group assignment**
- Blinding --> **Users unaware they are in an experiment**

Statistical testing tools (t-tests, significance levels, power calculations) were also transplanted, and Google, Meta, Netflix, and others now run tens of thousands of A/B tests annually.

## Core Mathematical Structures

**1. Average Treatment Effect (ATE)**

ATE = E[Y(1)] - E[Y(0)]

Y(1) is the outcome under treatment, Y(0) the outcome without. Since the same individual cannot be in both states at once, individual-level causal effects are unobservable (the fundamental problem of causal inference). Randomization makes the two groups' expected values comparable, sidestepping this.

**2. Sample Size Determination Formula**

n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

Here, alpha is the tolerable Type I error rate (typically 0.05), beta is the tolerable Type II error rate (1-beta equals power), sigma is the standard deviation of the outcome, and delta is the minimum effect size to detect.

## Fixed vs. Adaptive Design: The Core Tradeoff

The most fundamental tradeoff in RCTs lies between **internal validity and efficiency**.

A classical fixed-design RCT locks in sample size, treatment arms, and endpoints before the trial begins and changes nothing until the end. Even when evidence accumulates mid-trial that one treatment is clearly inferior, the protocol requires continued patient assignment.

Adaptive design adjusts the design based on accumulated data at interim analyses. Inferior arms can be terminated early and promising subgroups prioritized, but design changes risk inflating the Type I error rate (false positives), requiring statistical corrections.

This tradeoff recurs in AI. Training with fixed hyperparameters versus adjusting learning rates during training occupies the same tension.

## The Multiple Comparison Problem: Why Medicine's Rigor Is Needed in AI

Simultaneously testing multiple outcome variables or subgroups in clinical trials causes the **Type I error (false positive) rate to increase sharply**. Concretely, performing 20 independent tests at significance level 0.05, the probability of at least one false positive is 1 - (1-0.05)^20 = 64%. With 100 tests, it reaches 99.4% -- virtually certain. It is like searching for a suspect by opening 20 doors: the more doors you open, the higher the chance of falsely accusing an innocent person.

Medicine has grappled with this for decades. Bonferroni correction (dividing significance level by number of tests), Holm-Bonferroni (rank-based stepwise correction), and Benjamini-Hochberg's FDR (False Discovery Rate) control are standard solutions.

## Connections to Modern AI

Clinical trial design's influence on AI manifests at multiple levels. However, the nature of each connection differs.

**Direct inspiration:**

- **A/B Testing**: The most direct case of transplanting RCT structure (randomization, control groups, hypothesis testing) into a digital environment.
- **Thompson Sampling**: The algorithm Thompson (1933) proposed for comparing two unknown probabilities was forgotten for decades until Chapelle & Li (2011) and Agrawal & Goyal (2012) rediscovered it as a MAB strategy through online advertising and theoretical analysis. Separately, clinical trials adopted it as Bayesian adaptive randomization. It is now a core MAB strategy alongside epsilon-greedy and UCB (Upper Confidence Bound) in recommendation, pricing, and news personalization.
- **Multiple comparison correction**: Clinical trial methods like Bonferroni and FDR correction are directly used in hyperparameter search, model comparison, and feature selection.

**Structural similarity (independent convergence on the same problem):**

- **Cross-validation and controlled experiments**: k-fold cross-validation splits data into k parts and uses a different part as the test set each time. No direct historical link to RCTs, but it shares the same intuition of "separating training from evaluation."
- **Early stopping and adaptive trials**: Interim termination in adaptive trials developed directly from Wald's (1945) sequential analysis. ML early stopping evolved independently as an overfitting prevention technique, but both address the optimal stopping problem.

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

Thompson Sampling - a MAB algorithm that selects the arm with the highest sample drawn from each arm's reward posterior distribution; proposed by Thompson (1933)

Multi-armed bandit (MAB) - the problem of sequentially selecting among multiple options while balancing exploration and exploitation when the best option is unknown

Bonferroni correction - a conservative method for controlling Type I error in multiple testing by dividing the significance level by the number of tests; with 20 tests, the threshold drops from 0.05 to 0.05/20 = 0.0025
