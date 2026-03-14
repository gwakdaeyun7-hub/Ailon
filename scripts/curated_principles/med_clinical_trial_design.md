---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 무작위 대조 시험, A/B 테스트, 인과 추론, 톰슨 샘플링, 다중 비교 보정, 적응적 시험, 통계적 검정력, 평균 처치 효과
keywords_en: randomized controlled trial, A/B testing, causal inference, Thompson sampling, multiple comparison correction, adaptive trial design, statistical power, average treatment effect
---
Randomized Controlled Trial and A/B Testing - 의학의 인과 추론 황금 표준이 디지털 실험의 토대가 되기까지

## 괴혈병과 레몬: 실험의 시작

현대적 실험 설계의 가장 이른 선구자는 영국 해군 군의관 James Lind(1747)다. 그는 괴혈병에 걸린 선원 12명을 6개 그룹으로 나누어 각각 다른 치료법(사이다, 황산, 식초, 해수, 오렌지와 레몬, 바크 페이스트)을 시험했다. 오렌지와 레몬을 먹은 그룹만 회복했다. 통제 그룹의 존재, 동시 비교, 결과의 체계적 기록이라는 실험 원칙이 이미 이 원시적 시험에 담겨 있었다.

그러나 현대적 무작위 대조 시험(Randomized Controlled Trial, RCT)의 탄생은 두 가지 지적 흐름의 합류를 기다려야 했다. Ronald A. Fisher(1935)는 "The Design of Experiments"에서 무작위 배정(randomization)의 이론적 기반을 확립했다. **무작위 배정이 왜 필수적인지**를 명확히 한 것이다. 알려진 교란 변수뿐 아니라 **연구자가 인식하지 못한 교란 변수까지 균등하게 분포시키는 유일한 방법**이 무작위 배정이다.

1948년, 영국 의학연구위원회(MRC)의 스트렙토마이신 폐결핵 시험이 최초의 현대적 RCT로 인정받는다. 무작위 배정, 통제군, 맹검(blinding), 사전 등록된 프로토콜이 모두 갖춰진 이 시험은 이후 모든 임상시험의 원형이 되었다.

## RCT의 핵심 구조

RCT의 목표는 **인과 효과**의 추정이다. 관찰 연구에서는 상관관계와 인과관계를 구분할 수 없지만, 무작위 배정은 이 구분을 가능하게 한다.

평균 처치 효과(Average Treatment Effect):
ATE = E[Y(1)] - E[Y(0)]

Y(1)은 처치를 받았을 때의 결과, Y(0)은 받지 않았을 때의 결과다. 동일한 개체가 동시에 처치를 받으면서 받지 않을 수는 없으므로(인과 추론의 근본 문제), 무작위 배정으로 두 그룹의 기대값을 비교하여 ATE를 추정한다.

**통계적 검정력**(Power)은 실제로 효과가 있을 때 이를 감지할 확률이다:
Power = P(H0 기각 | H1 참)

필요한 표본 크기는 다음과 같이 결정된다:
n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

여기서 z_{alpha/2}는 유의수준의 임계값, z_beta는 검정력의 임계값, sigma^2는 결과 변수의 분산, delta는 감지하려는 최소 효과 크기다. 이 공식은 A/B 테스트의 표본 크기 계산에서도 그대로 사용된다.

## A/B 테스트: 의학에서 테크 산업으로의 직접 이식

A/B 테스트는 **RCT의 디지털 버전**이다. 구조적 대응은 거의 완벽하다.

- 환자 --> 사용자
- 처치군/대조군 --> 변형(variant) A/B
- 치료법 --> UI 변경, 알고리즘 변경, 가격 변경
- 임상적 결과(생존율, 증상 완화) --> 비즈니스 메트릭(전환율, 클릭률, 체류 시간)
- 무작위 배정 --> 사용자 해시 기반 그룹 할당
- 맹검 --> 사용자가 실험 중인지 모름

Google, Meta, Netflix, Microsoft 등이 연간 수만 건의 A/B 테스트를 실행한다. Kohavi, Tang, Xu의 "Trustworthy Online Controlled Experiments"(2020)는 이 분야의 표준 참고서다.

그러나 직접 이식이 완벽한 것은 아니다. 임상시험에서는 불가능하지만 테크에서는 가능한 것이 있고, 그 역도 있다.

테크 A/B 테스트의 장점: 표본 크기가 수백만 명으로 가용하고, 실험 비용이 낮으며, 빠르게 반복할 수 있다. 임상시험에서 수년이 걸리는 과정이 며칠 만에 완료된다.

테크 A/B 테스트의 고유한 문제: 네트워크 효과(한 사용자의 변경이 다른 사용자에게 영향), 신기 효과(novelty effect, 새로운 것에 대한 일시적 호기심), 다중 메트릭 문제(수십 개 메트릭을 동시에 추적하면 우연한 유의성 발견 확률 증가), 그리고 윤리적 제약이 임상시험에 비해 느슨하다는 점이다.

## Thompson Sampling: 임상시험에서 탄생한 강화학습

William R. Thompson(1933)은 임상시험의 윤리적 딜레마에서 출발했다. 두 가지 치료법 중 어느 것이 더 효과적인지 모를 때, 시험 기간 동안 환자들에게 열등한 치료를 배정하는 것은 윤리적으로 문제가 있다. 그의 해법은 각 치료법의 효과에 대한 사후 확률(posterior)에 비례하여 환자를 배정하는 것이었다.

이 아이디어가 80년 뒤에 **다중 슬롯머신 문제**(Multi-Armed Bandit, MAB)의 핵심 알고리즘으로 부활했다. Thompson Sampling은 각 선택지의 **보상 사후 분포에서 샘플을 뽑아** 가장 높은 샘플을 가진 선택지를 고른다.

1. 각 팔(arm)의 보상에 대한 사후 분포를 유지한다 (예: Beta 분포)
2. 각 사후 분포에서 하나씩 샘플을 뽑는다
3. 가장 높은 샘플을 가진 팔을 선택하고 보상을 관찰한다
4. 관찰된 보상으로 사후 분포를 갱신한다

이 알고리즘은 **탐색(exploration)과 활용(exploitation)을 자연스럽게 균형** 잡는다. 불확실한 선택지(사후 분포가 넓은)에서는 높은 샘플이 뽑힐 가능성이 있어 탐색이 일어나고, 확실히 좋은 선택지에서는 안정적으로 높은 샘플이 뽑혀 활용이 일어난다.

현대 추천 시스템, 광고 최적화, 동적 가격 책정에서 Thompson Sampling은 epsilon-greedy와 UCB(Upper Confidence Bound) 알고리즘과 함께 핵심 MAB 전략으로 사용된다.

## 적응적 시험 설계와 베이즈 최적화의 구조적 동치

현대 임상시험은 고정 설계에서 적응적 설계(adaptive design)로 진화하고 있다. 중간 분석(interim analysis)에서 축적된 데이터를 보고, 표본 크기를 조정하거나, 열등한 처치군을 조기 중단하거나, 유망한 하위 집단에 집중한다.

이 구조는 AI의 **베이즈 최적화**(Bayesian Optimization)와 놀라운 평행을 이룬다. 둘 다 **순차적 의사결정**, 불확실성 하의 탐색-활용 균형, 그리고 누적 데이터에 기반한 적응적 전략 조정이라는 같은 구조를 공유한다.

- 적응적 시험: 중간 데이터 --> 처치군 조정/중단 결정
- 베이즈 최적화: 관찰 결과 --> 가우시안 프로세스 갱신 --> 획득 함수로 다음 탐색점 결정

이것은 의학과 AI가 독립적으로 같은 구조적 문제(제한된 자원 하의 순차적 학습)에 대해 수렴적 해법을 발견한 사례다.

## 다중 비교 보정: 의학의 엄격함이 AI에 필요할 때

임상시험에서 여러 결과 변수나 하위 그룹을 동시에 검정하면 **1종 오류(거짓 양성) 확률이 급격히 증가**한다. 20개 독립 검정을 유의수준 0.05로 수행하면, 하나 이상에서 거짓 양성이 나올 확률은 1 - (1-0.05)^20 = 64%다.

Bonferroni 보정(유의수준을 검정 횟수로 나눔), Holm-Bonferroni, 그리고 Benjamini-Hochberg의 FDR(False Discovery Rate) 제어는 이 문제를 해결하는 표준 방법이다.

AI에서 이 문제는 **하이퍼파라미터 탐색에서 직접** 나타난다. 수백 가지 하이퍼파라미터 조합을 시도하고 "가장 좋은" 검증 성능을 선택하면, 이는 우연한 좋은 결과를 선택하는 다중 비교 문제와 동일하다. 더 엄밀한 AI 연구에서는 이를 인식하고 보정을 적용한다.

## 한계와 약점

- **윤리적 제약**: 모든 인과적 질문을 RCT로 답할 수 있는 것은 아니다. 흡연의 폐암 유발 효과를 RCT로 연구하는 것은 윤리적으로 불가능하다. 테크 A/B 테스트에서도 사용자에게 의도적으로 나쁜 경험을 배정하는 것의 윤리성이 논쟁된다(Facebook의 2014년 감정 전염 실험 논란).
- **외적 타당성 한계**: RCT의 내적 타당성(통제된 환경에서의 인과 관계)은 높지만, 결과가 실제 환경에 일반화되는지(외적 타당성)는 별개 문제다. 엄격히 통제된 임상시험의 효과가 실제 진료 환경에서 재현되지 않는 경우가 빈번하다.
- **선택 편향**: 테크 A/B 테스트에서 실험 대상이 전체 사용자를 대표하지 않을 수 있다(예: 활성 사용자 편향). 생존자 편향(survivor bias)도 흔한 문제다.
- **Simpson의 역설**: 전체 데이터에서 보이는 효과가 하위 그룹별로 보면 역전되는 현상. 무작위 배정이 이를 방지하지만, 사후 하위 그룹 분석에서는 여전히 발생할 수 있다.
- **p-해킹과 출판 편향**: 유의한 결과가 나올 때까지 분석 방법을 조정하는 관행(p-hacking)은 임상시험과 A/B 테스트 모두의 신뢰성을 위협한다.

## 용어 정리

무작위 대조 시험(randomized controlled trial, RCT) - 참가자를 처치군과 대조군에 무작위로 배정하여 처치의 인과 효과를 추정하는 실험 설계

평균 처치 효과(average treatment effect, ATE) - 처치를 받았을 때와 받지 않았을 때의 결과 차이의 기대값. E[Y(1)] - E[Y(0)]

통계적 검정력(statistical power) - 실제로 효과가 있을 때 이를 탐지할 확률. 1 - beta로 표현되며, 관례적으로 0.8 이상을 요구

Thompson Sampling - 각 선택지의 보상 사후 분포에서 샘플을 뽑아 최고값을 가진 선택지를 고르는 MAB 알고리즘. Thompson(1933)

다중 슬롯머신 문제(multi-armed bandit) - 여러 선택지 중 어느 것이 최선인지 모를 때, 탐색과 활용을 균형 잡으며 순차적으로 선택하는 문제

Bonferroni 보정(Bonferroni correction) - 다중 검정에서 유의수준을 검정 횟수로 나누어 1종 오류를 보정하는 보수적 방법

적응적 시험 설계(adaptive trial design) - 중간 데이터를 분석하여 시험 진행 중에 설계를 조정하는 임상시험 방법론

맹검(blinding) - 참가자, 연구자, 또는 양쪽 모두가 배정된 그룹을 모르도록 하는 실험 설계 요소

p-해킹(p-hacking) - 유의한 p-value가 나올 때까지 데이터 분석 방법을 조정하는 문제적 관행

외적 타당성(external validity) - 실험 결과가 실험 환경 밖의 실제 상황에 일반화될 수 있는 정도

---EN---
Randomized Controlled Trial and A/B Testing - How medicine's gold standard for causal inference became the foundation of digital experimentation

## Scurvy and Lemons: The Beginning of Experimentation

The earliest pioneer of modern experimental design was the British naval surgeon James Lind (1747). He divided 12 sailors with scurvy into 6 groups, testing different treatments (cider, sulfuric acid, vinegar, seawater, oranges and lemons, bark paste). Only the group given oranges and lemons recovered. The experimental principles of control groups, simultaneous comparison, and systematic recording of results were already embedded in this primitive trial.

However, the birth of the modern Randomized Controlled Trial (RCT) required the confluence of two intellectual streams. Ronald A. Fisher (1935) established the theoretical foundation for randomization in "The Design of Experiments." He clarified **why randomization is essential**: it is the only method that distributes not only known confounders but also **those unknown to the researcher evenly across groups**.

In 1948, the Medical Research Council's (MRC) streptomycin trial for pulmonary tuberculosis is recognized as the first modern RCT. Featuring randomization, control groups, blinding, and a pre-registered protocol, this trial became the archetype for all subsequent clinical trials.

## The Core Structure of RCTs

The RCT's goal is estimating **causal effects**. Observational studies cannot distinguish correlation from causation, but randomization makes this distinction possible.

Average Treatment Effect (ATE):
ATE = E[Y(1)] - E[Y(0)]

Y(1) is the outcome under treatment, Y(0) the outcome without. Since the same individual cannot simultaneously receive and not receive treatment (the fundamental problem of causal inference), randomization enables estimating ATE by comparing expected values between groups.

**Statistical Power** is the probability of detecting an effect when it truly exists:
Power = P(reject H0 | H1 true)

Required sample size is determined by:
n = (z_{alpha/2} + z_beta)^2 * 2 * sigma^2 / delta^2

where z_{alpha/2} is the critical value for significance level, z_beta for power, sigma^2 is outcome variance, and delta is the minimum detectable effect size. This formula is used identically in A/B test sample size calculations.

## A/B Testing: Direct Transplant from Medicine to Tech

A/B testing is the **digital version of the RCT**. The structural correspondence is nearly perfect:

- Patients --> Users
- Treatment/control groups --> Variants A/B
- Therapy --> UI changes, algorithm changes, pricing changes
- Clinical outcomes (survival, symptom relief) --> Business metrics (conversion, click-through, engagement)
- Randomization --> User hash-based group assignment
- Blinding --> Users unaware they are in an experiment

Google, Meta, Netflix, and Microsoft run tens of thousands of A/B tests annually. Kohavi, Tang, and Xu's "Trustworthy Online Controlled Experiments" (2020) is the standard reference for this field.

However, the transplant is not perfect. Some things possible in tech are impossible in clinical trials, and vice versa.

Tech A/B test advantages: Sample sizes in the millions, low experiment costs, rapid iteration. A process taking years in clinical trials completes in days.

Tech A/B test unique challenges: Network effects (one user's change affecting others), novelty effects (temporary curiosity about new things), multiple metrics problem (tracking dozens of metrics simultaneously increases the chance of spurious significance), and ethical constraints being looser than in clinical trials.

## Thompson Sampling: Reinforcement Learning Born from Clinical Trials

William R. Thompson (1933) started from the ethical dilemma of clinical trials. When it is unknown which of two treatments is more effective, assigning patients to the inferior treatment during the trial period is ethically problematic. His solution was to assign patients in proportion to each treatment's posterior probability of being effective.

This idea was resurrected 80 years later as a core algorithm for the **Multi-Armed Bandit** (MAB) problem. Thompson Sampling draws a sample from each arm's **reward posterior distribution** and selects the arm with the highest sample.

1. Maintain a posterior distribution for each arm's reward (e.g., Beta distribution)
2. Draw one sample from each posterior
3. Select the arm with the highest sample and observe the reward
4. Update the posterior with the observed reward

The algorithm **naturally balances exploration and exploitation**. Uncertain arms (wide posteriors) can produce high samples, enabling exploration; clearly good arms produce consistently high samples, enabling exploitation.

In modern recommendation systems, ad optimization, and dynamic pricing, Thompson Sampling is used as a core MAB strategy alongside epsilon-greedy and UCB (Upper Confidence Bound) algorithms.

## Adaptive Trial Design and Bayesian Optimization: Structural Equivalence

Modern clinical trials are evolving from fixed designs to adaptive designs. Based on accumulated data at interim analyses, they adjust sample sizes, terminate inferior treatment arms early, or focus on promising subgroups.

This structure parallels AI's **Bayesian Optimization** remarkably. Both share the same structure of **sequential decision-making**, exploration-exploitation balance under uncertainty, and adaptive strategy adjustment based on accumulated data.

- Adaptive trial: Interim data --> Treatment arm adjustment/termination decisions
- Bayesian optimization: Observed results --> GP update --> Acquisition function determines next exploration point

This is a case where medicine and AI independently discovered convergent solutions to the same structural problem: sequential learning under resource constraints.

## Multiple Comparison Correction: When Medicine's Rigor Is Needed in AI

When clinical trials simultaneously test multiple outcome variables or subgroups, the **Type I error (false positive) rate increases sharply**. Performing 20 independent tests at significance level 0.05, the probability of at least one false positive is 1 - (1-0.05)^20 = 64%.

Bonferroni correction (dividing significance level by number of tests), Holm-Bonferroni, and Benjamini-Hochberg's FDR (False Discovery Rate) control are standard solutions.

In AI, this problem **directly appears in hyperparameter search**. Trying hundreds of hyperparameter combinations and selecting the "best" validation performance is the same multiple comparison problem as selecting coincidentally good results. More rigorous AI research recognizes and applies corrections for this.

## Limitations and Weaknesses

- **Ethical constraints**: Not all causal questions can be answered with RCTs. Studying smoking's cancer-causing effect via RCT is ethically impossible. In tech A/B tests, the ethics of deliberately assigning poor experiences to users is debated (Facebook's 2014 emotional contagion study controversy).
- **External validity limitations**: RCTs have high internal validity (causal relationships in controlled settings), but whether results generalize to real environments (external validity) is a separate question. Clinical trial effects frequently fail to replicate in actual practice settings.
- **Selection bias**: In tech A/B tests, experimental subjects may not represent all users (e.g., active user bias). Survivor bias is also common.
- **Simpson's paradox**: An effect seen in overall data that reverses when examined by subgroups. Randomization prevents this, but it can still occur in post-hoc subgroup analyses.
- **p-hacking and publication bias**: The practice of adjusting analysis methods until significant results appear threatens the reliability of both clinical trials and A/B tests.

## Glossary

Randomized controlled trial (RCT) - an experimental design that randomly assigns participants to treatment and control groups to estimate the causal effect of treatment

Average treatment effect (ATE) - the expected difference in outcomes between receiving and not receiving treatment; E[Y(1)] - E[Y(0)]

Statistical power - the probability of detecting an effect when it truly exists; expressed as 1 - beta, conventionally requiring 0.8 or above

Thompson Sampling - a MAB algorithm that selects the arm with the highest sample drawn from each arm's reward posterior distribution; Thompson (1933)

Multi-armed bandit (MAB) - the problem of sequentially selecting among multiple options while balancing exploration and exploitation when the best option is unknown

Bonferroni correction - a conservative method for controlling Type I error in multiple testing by dividing the significance level by the number of tests

Adaptive trial design - a clinical trial methodology that adjusts the design during the trial based on interim data analysis

Blinding - an experimental design element that prevents participants, researchers, or both from knowing group assignments

p-hacking - the problematic practice of adjusting data analysis methods until a significant p-value is obtained

External validity - the extent to which experimental results can be generalized to real-world situations outside the experimental setting
