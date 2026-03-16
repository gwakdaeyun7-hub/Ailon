---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 베이지안 최적화, 가우시안 프로세스, 획득 함수, 대리 모델, 사전-사후 분포, 블랙박스 최적화, 탐색과 활용
keywords_en: Bayesian optimization, Gaussian process, acquisition function, surrogate model, prior-posterior distribution, black-box optimization, exploration vs exploitation
---
Bayesian Optimization - 관측할 때마다 믿음을 갱신하여, 비싼 실험을 최소 횟수로 수행하는 확률적 순차 최적화 전략

## 베이지안 추론: 믿음을 갱신하는 수학

베이지안 최적화(Bayesian Optimization, BO)의 뿌리는 18세기 확률론에 있다. 토머스 베이즈(Thomas Bayes)가 1763년 사후 출판된 논문에서 제시한 핵심 아이디어는 단순하다. **새로운 증거를 관측할 때마다, 기존의 믿음을 체계적으로 갱신할 수 있다.** 피에르시몽 라플라스(Pierre-Simon Laplace)가 이를 정식화한 베이즈 정리의 구조는 다음과 같다.

P(H|D) = P(D|H) * P(H) / P(D)

사전 확률(prior) P(H)은 데이터를 보기 전의 믿음이고, 우도(likelihood) P(D|H)는 가설이 참일 때 이 데이터가 관측될 확률이며, 사후 확률(posterior) P(H|D)는 데이터를 본 뒤 갱신된 믿음이다.

이 프레임워크가 최적화와 만나는 지점이 BO의 출발점이다. 함수의 형태를 모르는 상태에서, 몇 개의 점을 관측하면 "이 근처가 높을 것이다, 저 근처는 불확실하다"라는 **믿음의 지형**이 만들어진다. 안개 낀 산악 지형에서 몇 군데를 탐사한 뒤 지형 지도를 그리는 것과 같다. 탐사한 곳 주변은 등고선이 선명하고, 가보지 않은 곳은 안개 속에 숨어 있다. BO는 이 지도를 매 관측마다 갱신하면서, 다음에 어디를 탐사할지를 결정한다.

## 통계학에서 최적화 알고리즘으로

이 아이디어를 계산 가능한 최적화 전략으로 구체화한 것은 1960~70년대의 일이다. Kushner(1964)가 확률 모델 기반 순차적 최적화를 최초로 제안했고, Mockus(1974)가 기대 향상(Expected Improvement)이라는 획득 함수를 도입했다. 하지만 계산 비용 때문에 수십 년간 논문 속에 잠들어 있었다.

전환점은 Jones, Schonlau & Welch(1998)의 EGO(Efficient Global Optimization) 알고리즘이다. 가우시안 프로세스(GP)를 대리 모델로, Expected Improvement를 획득 함수로 조합하여 공학 설계 최적화에서 탁월한 효율을 시연했다. 이후 Snoek, Larochelle & Adams(2012)가 딥러닝 하이퍼파라미터 튜닝에 적용하면서 AI 커뮤니티에서 폭발적으로 주목받게 된다. 핵심 대응 관계는 다음과 같다.

- 사전 분포(prior) --> **함수의 초기 가정** (매끄러울 것이다, 연속일 것이다 등)
- 관측 데이터 --> **이미 평가한 하이퍼파라미터-성능 쌍**
- 사후 분포(posterior) --> **GP가 추정한 함수의 형태 + 불확실성** (평균과 분산)
- 다음 실험 선택 --> **획득 함수가 지목한 다음 평가점**
- 믿음의 갱신 --> **관측할 때마다 GP를 다시 학습하여 예측을 정밀화**

## 가우시안 프로세스: 함수 위의 불확실성 지도

BO의 표준 대리 모델인 가우시안 프로세스(GP)는 "함수들의 집합 위에 정의된 확률 분포"다. 하나의 함수 값을 예측하는 것이 아니라, 가능한 함수들의 전체 분포를 추적한다. n개의 관측점이 주어졌을 때, 새로운 점 x*에서의 GP 예측은 다음과 같다.

예측 평균: mu(x*) = k*^T K^(-1) y
예측 분산: sigma^2(x*) = k(x*, x*) - k*^T K^(-1) k*

K는 관측점들 사이의 커널 행렬로, 두 입력의 유사도를 정의한다. k*는 새 점과 기존 관측점들 사이의 유사도 벡터다.

핵심 동작은 이렇다. **관측점 바로 위**에서는 sigma^2이 0에 수렴한다. 이미 측정한 곳은 불확실성이 사라진다. **모든 관측점에서 먼 곳**에서는 sigma^2이 최대가 된다. 한 번도 가보지 않은 곳은 최대 불확실성을 가진다. 이 **불확실성의 자동 정량화**가 GP를 단순 회귀 모델과 구분하는 핵심이다. 랜덤 포레스트나 신경망은 예측값만 주지만, GP는 "여기는 확신한다, 저기는 모른다"를 동시에 알려준다.

## 획득 함수: 탐색과 활용의 수학적 균형

대리 모델이 현재 지식을 나타낸다면, 획득 함수(acquisition function)는 "다음 실험의 가치"를 점수화하는 기준이다.

**기대 향상(Expected Improvement, EI)**: 현재 최선값 f_best보다 얼마나 더 좋아질 것으로 기대되는지를 측정한다. EI(x) = E[max(f_best - f(x), 0)]. GP의 mu와 sigma를 사용하여 해석적으로 계산된다. **mu가 f_best보다 좋으면**(활용 가치) EI가 크고, **sigma가 크면**(탐색 가치) EI가 역시 크다. 탐색과 활용의 균형이 수식 안에 자연스럽게 녹아 있다.

**상한 신뢰 구간(UCB)**: UCB(x) = mu(x) + kappa * sigma(x). mu는 활용 항, kappa * sigma는 탐색 항이다. kappa가 크면 탐색 우세, kappa = 0이면 순수 활용이 된다.

**톰슨 샘플링**: GP 사후 분포에서 함수를 샘플링하여 그 함수의 최적점을 다음 평가점으로 선택한다. 구현이 단순하고 병렬 실험에 유리하다.

## 비싼 실험에서 빛나는 BO

BO의 가치는 "한 번 평가하는 데 드는 비용"에서 나온다. 신경망 하이퍼파라미터 평가에 GPU 수 시간, 신약 후보 활성 측정에 수주가 걸리는 상황에서, 그리드 서치가 100번 평가하는 동안 BO는 20~30번으로 동일 성능에 도달한다. Snoek et al.(2012)은 학습률, 배치 크기, 드롭아웃 비율을 동시에 최적화할 때 BO가 전문가의 수동 튜닝과 랜덤 서치 모두를 능가함을 보였다.

반대로 함수 평가가 싸고 차원이 높은 문제에서는 GP의 계산 비용이 평가 비용을 압도하므로 BO가 적합하지 않다. BO는 **"한 방이 비싼 게임"을 위한 전략**이다.

## 현대 AI 기법과의 연결

**베이지안 추론의 직접 적용:**

- **하이퍼파라미터 튜닝 도구들**: Spearmint, Hyperopt, Optuna, BoTorch 등이 BO를 핵심 엔진으로 채택했다. Bergstra et al.(2011)의 TPE는 GP 대신 비모수적 밀도 추정을 사용하여 범주형 변수를 자연스럽게 처리한다
- **신경망 구조 탐색(NAS)**: 아키텍처 선택도 BO로 최적화된다. 구조 하나 학습에 GPU 수십 시간이 걸리므로, BO가 빛나는 "비싼 평가" 문제다
- **능동 학습(Active Learning)**: "어떤 데이터를 다음에 라벨링할 것인가"가 BO의 "어디를 다음에 평가할 것인가"와 동일한 구조다

**구조적 유사성:**

- **강화학습의 탐색-활용 균형**: UCB 획득 함수가 multi-armed bandit의 UCB1(Auer et al., 2002)과 같은 이름을 공유하는 것은 우연이 아니다. 둘 다 평균 + 신뢰 구간의 형태지만, BO의 UCB는 연속 함수 모델 위에서, bandit의 UCB1은 이산적 팔 선택 위에서 독립적으로 발전했다
- **모델 기반 강화학습**: 환경의 전이 모델을 학습하고 그 위에서 계획을 세우는 구조가, BO에서 대리 모델을 학습한 뒤 획득 함수로 결정하는 구조와 병렬적이다

## 한계와 약점

- **차원의 저주**: 표준 GP 기반 BO는 약 10~20차원까지 효과적이다. 그 이상에서는 커널이 고차원 구조를 포착하기 어렵고, 획득 함수 최적화 자체가 고차원 최적화 문제가 되는 역설에 빠진다. 근본적 한계이며 완전한 해결책은 없다
- **계산 확장성**: GP의 커널 행렬 역행렬 계산이 O(n^3) 시간, O(n^2) 메모리를 요구한다. 관측이 수천 건을 넘으면 GP 자체가 병목이 된다
- **매끄러움 가정**: GP의 커널 함수는 목적 함수가 연속이고 매끄럽다고 가정한다. 불연속 함수나 극도로 노이즈가 큰 환경에서는 성능이 저하된다
- **초기 탐색 오버헤드**: 변수가 2~3개뿐인 단순 문제에서는 전문가가 직관적으로 좋은 설정에 도달하여, BO의 초기 탐색이 오히려 비효율적일 수 있다

## 용어 정리

사전 확률(prior) - 데이터를 관측하기 전에 가설에 대해 가지고 있는 초기 믿음의 확률 분포

사후 확률(posterior) - 데이터를 관측한 뒤 베이즈 정리로 갱신된 믿음의 확률 분포

대리 모델(surrogate model) - 비용이 높은 실제 함수를 근사하는 저비용 확률 모델. GP가 표준이지만 랜덤 포레스트, 신경망 등도 사용

가우시안 프로세스(Gaussian process) - 함수 공간 위의 확률 분포. 관측점을 조건으로 미관측 영역의 평균과 분산을 해석적으로 계산

획득 함수(acquisition function) - 대리 모델의 예측 평균과 불확실성을 조합하여 다음 평가점의 가치를 점수화하는 함수

기대 향상(Expected Improvement) - 현재 최선값을 초과할 기대 크기를 측정하는 획득 함수. Mockus(1974) 제안, Jones et al.(1998)이 GP와 결합

커널 함수(kernel function) - GP에서 두 입력 사이의 유사도를 정의하는 함수. RBF 커널은 거리가 가까울수록 유사도가 높다고 가정

하이퍼파라미터(hyperparameter) - 모델 학습 전에 사람이 설정해야 하는 값(학습률, 배치 크기 등). 학습 과정에서 자동으로 결정되지 않음

---EN---
Bayesian Optimization - A probabilistic sequential optimization strategy that updates beliefs with each observation to minimize the number of expensive evaluations

## Bayesian Inference: The Mathematics of Updating Beliefs

The roots of Bayesian Optimization (BO) lie in 18th-century probability theory. Thomas Bayes's 1763 posthumous paper presented a simple core idea: **each time new evidence is observed, existing beliefs can be systematically updated.** Bayes' theorem, formalized by Pierre-Simon Laplace:

P(H|D) = P(D|H) * P(H) / P(D)

The prior P(H) is belief before data, the likelihood P(D|H) is the probability of observing data if the hypothesis is true, and the posterior P(H|D) is the updated belief after data.

Where this meets optimization is BO's starting point. With an unknown function shape, observing a few points creates a **landscape of beliefs**: "this area is probably high, that area is uncertain." Imagine mapping a foggy mountain range after probing a few locations. Contour lines are clear around probed spots; unexplored areas remain hidden. BO updates this map with each observation and decides where to probe next.

## From Statistics to Optimization Algorithm

Turning this into a computable strategy happened in the 1960s-70s. Kushner (1964) first proposed probabilistic sequential optimization. Mockus (1974) introduced Expected Improvement as an acquisition function. But computational costs kept these ideas dormant for decades.

The turning point was Jones, Schonlau & Welch's (1998) EGO algorithm. Combining a Gaussian Process (GP) as surrogate model with Expected Improvement demonstrated outstanding efficiency in engineering optimization. Snoek, Larochelle & Adams (2012) then applied this to deep learning hyperparameter tuning, triggering an explosion of interest. Key correspondences:

- Prior distribution --> **initial assumptions about the function**
- Observed data --> **already-evaluated hyperparameter-performance pairs**
- Posterior distribution --> **GP's estimated function shape + uncertainty**
- Next experiment selection --> **next evaluation point from the acquisition function**
- Belief updating --> **retraining GP after each observation**

## Gaussian Processes: An Uncertainty Map over Functions

The GP is "a probability distribution over a collection of functions." Rather than predicting a single value, it tracks the entire distribution of possible functions. Given n observations, the GP prediction at a new point x*:

Predictive mean: mu(x*) = k*^T K^(-1) y
Predictive variance: sigma^2(x*) = k(x*, x*) - k*^T K^(-1) k*

K is the kernel matrix defining input similarity. k* is the similarity vector between x* and existing observations.

The key behavior: **at observation points**, sigma^2 converges to 0 -- no uncertainty. **Far from all observations**, sigma^2 reaches maximum -- complete uncertainty. This **automatic uncertainty quantification** distinguishes GP from plain regression. Random forests or neural networks provide predictions only; GP simultaneously says "confident here, uncertain there."

## Acquisition Functions: Mathematical Balance of Exploration and Exploitation

The acquisition function scores "the value of the next experiment."

**Expected Improvement (EI)**: Measures expected improvement over current best f_best. EI(x) = E[max(f_best - f(x), 0)]. Computed analytically using GP's mu and sigma. High when mu is better than f_best (exploitation value) or sigma is large (exploration value) -- balance naturally embedded.

**Upper Confidence Bound (UCB)**: UCB(x) = mu(x) + kappa * sigma(x). mu is exploitation, kappa * sigma is exploration. Large kappa favors exploration; kappa = 0 becomes pure exploitation.

**Thompson Sampling**: Draws a function from the GP posterior and selects its optimum as the next evaluation point. Simple to implement and favorable for parallel experiments.

## Where BO Shines: Expensive Evaluations

BO's value comes from evaluation cost. Testing neural network hyperparameters takes hours of GPU time; drug candidate testing takes weeks. While grid search evaluates 100 times, BO achieves equivalent performance in 20-30 evaluations. Snoek et al. (2012) showed BO outperformed both expert manual tuning and random search when simultaneously optimizing learning rate, batch size, and dropout.

Conversely, when evaluation is cheap and dimensionality high, GP's computational cost overwhelms evaluation cost, making BO unsuitable. BO is a **strategy for "games where each shot is expensive."**

## Connections to Modern AI

**Direct application of Bayesian inference:**

- **Hyperparameter tuning tools**: Spearmint, Hyperopt, Optuna, and BoTorch adopted BO as their core engine. Bergstra et al.'s (2011) TPE uses nonparametric density estimation instead of GP, naturally handling categorical variables
- **Neural Architecture Search (NAS)**: Architecture choices are optimized via BO -- exactly the "expensive evaluation" problem where BO excels
- **Active Learning**: "Which data to label next" has the same structure as BO's "where to evaluate next"

**Structural similarities sharing the same intuition independently:**

- **Exploration-exploitation in RL**: UCB sharing its name with multi-armed bandit's UCB1 (Auer et al., 2002) is no coincidence. Both use mean + confidence interval, but BO's UCB operates over continuous GP functions while bandit UCB1 operates over discrete arms
- **Model-based RL**: Learning an environment model then planning over it parallels BO's surrogate-then-acquisition structure

## Limitations and Weaknesses

- **Curse of dimensionality**: Standard GP-based BO works up to ~10-20 dimensions. Beyond that, kernels struggle with high-dimensional structure, and acquisition function optimization itself becomes a high-dimensional problem -- a fundamental limitation without complete solution
- **Computational scalability**: GP kernel matrix inversion requires O(n^3) time and O(n^2) memory. Beyond several thousand observations, GP itself becomes the bottleneck
- **Smoothness assumptions**: GP kernels assume the objective is continuous and smooth. Performance degrades on discontinuous or extremely noisy functions
- **Initial exploration overhead**: For simple 2-3 variable problems, experienced practitioners may intuitively reach good settings faster than BO's initial exploration phase

## Glossary

Prior - the probability distribution of initial beliefs about a hypothesis before observing data

Posterior - the probability distribution of beliefs updated via Bayes' theorem after observing data

Surrogate model - a low-cost probabilistic model approximating the expensive true function; GP is standard, but random forests and neural networks are also used

Gaussian process - a probability distribution over function space; analytically computes mean and variance of unobserved regions conditioned on observations

Acquisition function - a function scoring the next evaluation point's value by combining the surrogate model's predictive mean and uncertainty

Expected Improvement - an acquisition function measuring expected magnitude of improvement over current best; proposed by Mockus (1974), combined with GP by Jones et al. (1998)

Kernel function - a function defining similarity between two inputs in a GP; the RBF kernel assumes higher similarity for closer distances

Hyperparameter - a value set by a human before model training (learning rate, batch size, etc.); not automatically determined during learning