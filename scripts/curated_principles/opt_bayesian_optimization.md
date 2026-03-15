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

이 프레임워크가 최적화와 만나는 지점이 BO의 출발점이다. 함수의 형태를 모르는 상태에서, 몇 개의 점을 관측하고 나면 "이 근처가 높을 것이다, 저 근처는 불확실하다"라는 **믿음의 지형**이 만들어진다. 이것을 공간적으로 상상하면, 안개 낀 산악 지형에서 몇 군데를 탐사한 뒤 지형 지도를 그리는 것과 같다. 탐사한 곳 주변은 등고선이 선명하고, 아직 가보지 않은 곳은 안개 속에 숨어 있다. BO는 이 지도를 매 관측마다 갱신하면서, 다음에 안개 속 어디를 탐사할지를 결정한다.

## 통계학에서 최적화 알고리즘으로

이 아이디어를 계산 가능한 최적화 전략으로 구체화한 것은 1960~70년대의 일이다. Kushner(1964)가 확률 모델 기반 순차적 최적화를 최초로 제안했고, Mockus(1974)가 기대 향상(Expected Improvement)이라는 획득 함수를 도입하여 "다음에 어디를 볼 것인가"라는 질문에 수학적으로 답하는 틀을 만들었다. 하지만 이 아이디어들은 계산 비용 때문에 수십 년간 논문 속에 잠들어 있었다.

전환점은 Jones, Schonlau & Welch(1998)의 EGO(Efficient Global Optimization) 알고리즘이다. 가우시안 프로세스(Gaussian Process, GP)를 대리 모델로, Expected Improvement를 획득 함수로 조합하여 공학 설계 최적화에서 탁월한 효율을 시연했다. 이후 Snoek, Larochelle & Adams(2012)가 딥러닝 하이퍼파라미터 튜닝에 적용하면서 AI 커뮤니티에서 폭발적으로 주목받게 된다. 핵심 대응 관계는 다음과 같다.

- 사전 분포(prior) --> **함수의 초기 가정** (매끄러울 것이다, 연속일 것이다 등)
- 관측 데이터 --> **이미 평가한 하이퍼파라미터-성능 쌍** (학습률 0.01에서 정확도 92% 등)
- 사후 분포(posterior) --> **GP가 추정한 함수의 형태 + 불확실성** (평균과 분산)
- 다음 실험 선택 --> **획득 함수가 지목한 다음 평가점**
- 믿음의 갱신 --> **관측할 때마다 GP를 다시 학습하여 예측을 정밀화**

## 가우시안 프로세스: 함수 위의 불확실성 지도

BO의 표준 대리 모델(surrogate model)인 가우시안 프로세스(GP)는 "함수들의 집합 위에 정의된 확률 분포"다. 하나의 함수 값을 예측하는 것이 아니라, 가능한 함수들의 전체 분포를 추적한다. n개의 관측점 (X, y)가 주어졌을 때, 새로운 점 x*에서의 GP 예측은 다음과 같다.

1. 예측 평균: mu(x*) = k*^T K^(-1) y
2. 예측 분산: sigma^2(x*) = k(x*, x*) - k*^T K^(-1) k*

K는 관측점들 사이의 커널 행렬(kernel matrix)로, 두 입력이 얼마나 유사한지를 정의한다. k*는 새 점 x*와 기존 관측점들 사이의 유사도 벡터다.

이 수식의 극단적 경우를 추적하면 GP의 동작이 선명해진다. **관측점 바로 위**에서는 k*와 K의 해당 행이 거의 동일해지므로 sigma^2이 0에 수렴한다. 이미 측정한 곳은 불확실성이 사라진다. 반대로 **모든 관측점에서 멀리 떨어진 곳**에서는 k*가 거의 영벡터가 되어 sigma^2이 k(x*, x*)에 근접한다. 한 번도 가보지 않은 곳은 최대 불확실성을 가진다. 안개 비유로 돌아가면, 탐사한 지점 주변의 안개는 걷히고 멀리 갈수록 안개가 짙어지는 것이다.

이 **불확실성의 자동 정량화**가 GP를 단순 회귀 모델과 구분하는 핵심이다. 랜덤 포레스트나 신경망은 예측값만 주지만, GP는 "여기는 확신한다, 저기는 모른다"를 동시에 알려준다.

## 획득 함수: 탐색과 활용의 수학적 균형

대리 모델이 현재 지식을 나타낸다면, 획득 함수(acquisition function)는 "다음 실험의 가치"를 점수화하는 기준이다.

1. **기대 향상(Expected Improvement, EI)**: 현재 최선값 f_best보다 얼마나 더 좋아질 것으로 기대되는지를 측정한다.

EI(x) = E[max(f_best - f(x), 0)]

이 기댓값은 GP의 mu와 sigma를 사용하여 해석적으로(closed-form) 계산된다. f_best 아래쪽 영역의 정규분포 적분이다. **mu가 f_best보다 훨씬 좋으면**(활용 가치가 높으면) EI가 크고, **sigma가 크면**(탐색 가치가 높으면) EI가 역시 크다. 이미 좋다고 알려진 곳과 아직 모르는 곳 모두에 높은 점수를 주기 때문에, 탐색과 활용의 균형이 수식 안에 자연스럽게 녹아 있다.

2. **상한 신뢰 구간(Upper Confidence Bound, UCB)**: 더 직관적인 형태다.

UCB(x) = mu(x) + kappa * sigma(x)

mu(x)는 활용 항이고 kappa * sigma(x)는 탐색 항이다. kappa가 크면 불확실한 영역에 가중치를 두어 탐색이 우세해지고, kappa가 0이면 mu만 남아 순수 활용(탐욕 전략)이 된다. Srinivas et al.(2010)은 UCB의 이론적 후회 한계(regret bound)를 증명하여 kappa를 원칙적으로 설정하는 방법을 제시했다.

3. **톰슨 샘플링(Thompson Sampling)**: GP의 사후 분포에서 함수 하나를 랜덤으로 샘플링하여 그 함수의 최적점을 다음 평가점으로 선택한다. 구현이 단순하고 병렬 실험에 유리하다.

## 비싼 실험 vs 싼 실험: BO가 빛나는 조건

BO의 가치를 이해하려면 "한 번 평가하는 데 드는 비용"이 핵심이다. 신경망의 학습률을 바꿔가며 검증 정확도를 측정하려면 GPU로 수 시간에서 수일이 걸린다. 신약 후보 물질의 활성을 실험실에서 측정하려면 수주와 수천만 원이 필요하다. 이런 상황에서 그리드 서치(grid search)가 100번 평가하는 동안, BO는 동일 성능을 20~30번 만에 달성한다. Snoek et al.(2012)의 실험이 이를 구체적으로 보여주었다. 학습률, 배치 크기, 드롭아웃 비율, 은닉층 크기 등을 동시에 최적화할 때, BO가 전문가의 수동 튜닝과 랜덤 서치 모두를 능가했다.

반대로 함수 평가가 싸고 차원이 높은 문제(변수가 수백 개 이상인 신경망 가중치 최적화 등)에서는 GP의 계산 비용이 평가 비용을 압도하므로 BO가 적합하지 않다. BO는 **"한 방이 비싼 게임"을 위한 전략**이다.

## 현대 AI 기법과의 연결

BO의 "불확실성을 정량화하여 다음 행동을 결정한다"는 프레임워크는 현대 AI 여러 영역에서 변형되어 쓰이고 있다.

**베이지안 추론의 직접 적용:**

- **하이퍼파라미터 튜닝 도구들**: Snoek et al.(2012) 이후 Spearmint, Hyperopt, Optuna, BoTorch 등이 BO를 핵심 엔진으로 채택했다. Bergstra et al.(2011)의 TPE(Tree-structured Parzen Estimator)는 GP 대신 비모수적 밀도 추정을 사용하여 범주형 변수와 조건부 하이퍼파라미터를 자연스럽게 처리한다. Falkner et al.(2018)의 BOHB는 BO와 Hyperband의 조기 종료 전략을 결합했다.
- **신경망 구조 탐색(NAS)**: 신경망 레이어 수, 연결 방식 같은 아키텍처 선택도 BO로 최적화된다. 구조 하나를 학습시키는 데 GPU 수십 시간이 걸리므로, 정확히 BO가 빛나는 "비싼 평가" 문제다.
- **능동 학습(Active Learning)**: "어떤 데이터를 다음에 라벨링할 것인가"라는 질문이 BO의 "어디를 다음에 평가할 것인가"와 동일한 구조다. 불확실성이 높은 샘플을 우선 선택하는 전략은 GP의 sigma를 활용하는 것과 원리적으로 같다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **강화학습의 탐색-활용 균형**: UCB 획득 함수가 multi-armed bandit의 UCB1(Auer et al., 2002)과 같은 이름을 공유하는 것은 우연이 아니다. 둘 다 "알려진 좋은 선택을 활용할 것인가, 아직 불확실한 선택을 탐색할 것인가"라는 동일한 딜레마를 다루며, 수학적으로도 평균 + 신뢰 구간의 형태가 동일하다. 하지만 BO의 UCB는 GP라는 연속 함수 모델 위에서, bandit의 UCB1은 이산적 팔 선택 위에서 독립적으로 발전했다.
- **모델 기반 강화학습**: 환경의 전이 모델을 학습한 뒤 그 모델 위에서 계획을 세우는 구조가, BO에서 대리 모델을 학습한 뒤 획득 함수로 다음 행동을 결정하는 구조와 병렬적이다. 둘 다 "세상의 모델을 먼저 만들고, 그 모델을 기반으로 결정한다"는 전략을 공유한다.

## 한계와 약점

BO는 강력하지만 적용 범위에 명확한 경계가 있다.

- **차원의 저주**: 표준 GP 기반 BO는 약 10~20차원까지 효과적이다. 그 이상에서는 GP의 커널이 고차원 공간의 구조를 포착하기 어려워지고, 획득 함수를 최적화하는 것 자체가 또 다른 고차원 최적화 문제가 되는 역설에 빠진다. 이는 근본적 한계이며, 현재까지 완전한 해결책은 없다.
- **계산 확장성**: GP의 핵심 연산인 커널 행렬 역행렬 계산이 O(n^3) 시간, O(n^2) 메모리를 요구한다. 관측이 수천 건을 넘으면 GP 자체가 병목이 된다. 희소 근사(sparse approximation)나 랜덤 포레스트 기반 SMAC(Hutter et al., 2011), 뉴럴 프로세스 등 대안 모델이 있지만, GP의 불확실성 추정 품질을 다소 희생한다.
- **매끄러움 가정**: GP의 커널 함수(보통 RBF나 Matern)는 목적 함수가 연속이고 매끄럽다고 가정한다. 불연속 함수나 극도로 노이즈가 큰 환경에서는 이 가정이 깨져 성능이 저하된다.
- **초기 탐색 오버헤드**: BO는 GP를 학습하기 위한 초기 관측이 필요하다. 변수가 2~3개뿐인 단순 문제에서는 경험 있는 전문가가 직관적으로 몇 번 만에 좋은 설정에 도달하여, BO의 초기 탐색이 오히려 비효율적일 수 있다.

## 용어 정리

사전 확률(prior) - 데이터를 관측하기 전에 가설에 대해 가지고 있는 초기 믿음의 확률 분포

사후 확률(posterior) - 데이터를 관측한 뒤 베이즈 정리로 갱신된 믿음의 확률 분포

블랙박스 함수(black-box function) - 내부 구조를 모르고, 입력을 넣으면 출력만 관측할 수 있는 함수. 그래디언트 계산 불가

대리 모델(surrogate model) - 비용이 높은 실제 함수를 근사하는 저비용 확률 모델. GP가 표준이지만 랜덤 포레스트, 신경망 등도 사용

가우시안 프로세스(Gaussian process) - 함수 공간 위의 확률 분포. 관측점을 조건으로 미관측 영역의 평균과 분산을 해석적으로 계산. 커널 함수 선택이 함수의 매끄러움 가정을 결정

획득 함수(acquisition function) - 대리 모델의 예측 평균과 불확실성을 조합하여 다음 평가점의 가치를 점수화하는 함수

기대 향상(Expected Improvement) - 현재 최선값을 초과할 기대 크기를 측정하는 획득 함수. Mockus(1974) 제안, Jones et al.(1998)이 GP와 결합

커널 함수(kernel function) - GP에서 두 입력 사이의 유사도를 정의하는 함수. RBF 커널은 거리가 가까울수록 유사도가 높다고 가정

하이퍼파라미터(hyperparameter) - 모델 학습 전에 사람이 설정해야 하는 값(학습률, 배치 크기 등). 학습 과정에서 자동으로 결정되지 않음

희소 근사(sparse approximation) - GP의 O(n^3) 계산을 줄이기 위해 소수의 유도점(inducing points)만으로 전체를 근사하는 기법

---EN---
Bayesian Optimization - A probabilistic sequential optimization strategy that updates beliefs with each observation to minimize the number of expensive evaluations

## Bayesian Inference: The Mathematics of Updating Beliefs

The roots of Bayesian Optimization (BO) lie in 18th-century probability theory. The core idea, presented in Thomas Bayes's posthumously published 1763 paper, is simple: **each time new evidence is observed, existing beliefs can be systematically updated.** The structure of Bayes' theorem, formalized by Pierre-Simon Laplace, is:

P(H|D) = P(D|H) * P(H) / P(D)

The prior P(H) is the belief before seeing data, the likelihood P(D|H) is the probability of observing this data if the hypothesis is true, and the posterior P(H|D) is the updated belief after seeing data.

Where this framework meets optimization is the starting point of BO. When the shape of a function is unknown and only a few points have been observed, a **landscape of beliefs** forms: "this area is probably high, that area is uncertain." Spatially, imagine mapping a mountain range shrouded in fog after probing a few locations. Contour lines are clear around probed spots, while unexplored areas remain hidden in fog. BO updates this map with each observation and decides where in the fog to probe next.

## From Statistics to Optimization Algorithm

Turning this idea into a computable optimization strategy happened in the 1960s-70s. Kushner (1964) first proposed sequential optimization using probabilistic models. Mockus (1974) introduced Expected Improvement as an acquisition function, creating a mathematical framework to answer "where to look next." However, these ideas remained dormant in papers for decades due to computational costs.

The turning point was Jones, Schonlau & Welch's (1998) EGO (Efficient Global Optimization) algorithm. By combining a Gaussian Process (GP) as the surrogate model with Expected Improvement as the acquisition function, they demonstrated outstanding efficiency in engineering design optimization. Snoek, Larochelle & Adams (2012) then applied this to deep learning hyperparameter tuning, triggering an explosion of interest in the AI community. The key correspondences are:

- Prior distribution --> **initial assumptions about the function** (smooth, continuous, etc.)
- Observed data --> **already-evaluated hyperparameter-performance pairs** (learning rate 0.01 gave 92% accuracy, etc.)
- Posterior distribution --> **GP's estimated function shape + uncertainty** (mean and variance)
- Next experiment selection --> **the next evaluation point designated by the acquisition function**
- Belief updating --> **retraining the GP after each observation to refine predictions**

## Gaussian Processes: An Uncertainty Map over Functions

The standard surrogate model in BO, the Gaussian Process (GP), is "a probability distribution defined over a collection of functions." Rather than predicting a single function value, it tracks the entire distribution of possible functions. Given n observations (X, y), the GP prediction at a new point x* is:

1. Predictive mean: mu(x*) = k*^T K^(-1) y
2. Predictive variance: sigma^2(x*) = k(x*, x*) - k*^T K^(-1) k*

K is the kernel matrix between observations, defining how similar two inputs are. k* is the similarity vector between the new point x* and existing observations.

Tracking the extreme cases of these equations clarifies GP behavior. **Directly at an observation point**, k* nearly matches the corresponding row of K, so sigma^2 converges to 0 -- already-measured locations have no uncertainty. Conversely, **far from all observations**, k* approaches the zero vector, and sigma^2 approaches k(x*, x*) -- unvisited locations carry maximum uncertainty. Returning to the fog analogy: fog clears around probed points and thickens with distance.

This **automatic quantification of uncertainty** is what distinguishes GP from plain regression models. Random forests or neural networks provide predictions only, but GP simultaneously says "I'm confident here, I don't know there."

## Acquisition Functions: The Mathematical Balance of Exploration and Exploitation

If the surrogate model represents current knowledge, the acquisition function scores "the value of the next experiment."

1. **Expected Improvement (EI)**: Measures how much improvement over the current best f_best is expected.

EI(x) = E[max(f_best - f(x), 0)]

This expectation is computed analytically (closed-form) using the GP's mu and sigma -- the integral of the normal distribution below f_best. **When mu is much better than f_best** (high exploitation value), EI is large. **When sigma is large** (high exploration value), EI is also large. Because it assigns high scores to both known-good regions and unknown regions, the exploration-exploitation balance is naturally embedded in the formula.

2. **Upper Confidence Bound (UCB)**: A more intuitive form.

UCB(x) = mu(x) + kappa * sigma(x)

mu(x) is the exploitation term and kappa * sigma(x) is the exploration term. Large kappa weights uncertain regions, making exploration dominant; kappa at 0 leaves only mu, becoming pure exploitation (greedy strategy). Srinivas et al. (2010) proved theoretical regret bounds for UCB, providing a principled way to set kappa.

3. **Thompson Sampling**: Randomly draws a function from the GP posterior and selects that function's optimum as the next evaluation point. Simple to implement and favorable for parallel experiments.

## Expensive vs. Cheap Evaluations: Where BO Shines

Understanding BO's value requires focusing on "the cost of a single evaluation." Testing neural network learning rates by measuring validation accuracy takes hours to days on GPUs. Measuring a drug candidate's activity in the lab takes weeks and tens of thousands of dollars. In such settings, while grid search evaluates 100 times, BO achieves equivalent performance in 20-30 evaluations. Snoek et al.'s (2012) experiments demonstrated this concretely: when simultaneously optimizing learning rate, batch size, dropout rate, and hidden layer sizes, BO outperformed both expert manual tuning and random search.

Conversely, for problems where function evaluation is cheap and dimensionality is high (e.g., optimizing neural network weights with hundreds or more variables), GP's computational cost overwhelms evaluation cost, making BO unsuitable. BO is a **strategy for "games where each shot is expensive."**

## Connections to Modern AI

BO's framework of "quantifying uncertainty to decide the next action" is used in transformed forms across modern AI.

**Direct application of Bayesian inference:**

- **Hyperparameter tuning tools**: Following Snoek et al. (2012), Spearmint, Hyperopt, Optuna, and BoTorch adopted BO as their core engine. Bergstra et al.'s (2011) TPE (Tree-structured Parzen Estimator) uses nonparametric density estimation instead of GP, naturally handling categorical and conditional hyperparameters. Falkner et al.'s (2018) BOHB combines BO with Hyperband's early stopping strategy.
- **Neural Architecture Search (NAS)**: Architecture choices like number of layers and connection patterns are also optimized via BO. Training a single architecture takes tens of GPU hours -- exactly the "expensive evaluation" problem where BO excels.
- **Active Learning**: The question "which data point to label next" has the same structure as BO's "where to evaluate next." The strategy of prioritizing high-uncertainty samples is fundamentally the same as leveraging GP's sigma.

**Structural similarities sharing the same intuition independently:**

- **Exploration-exploitation in reinforcement learning**: It is no coincidence that the UCB acquisition function shares its name with the multi-armed bandit's UCB1 (Auer et al., 2002). Both address the same dilemma -- "exploit known good choices or explore uncertain ones" -- and share the mathematical form of mean + confidence interval. However, BO's UCB developed over a continuous function model (GP), while bandit UCB1 developed over discrete arm selection, independently.
- **Model-based reinforcement learning**: The structure of learning an environment's transition model and then planning over it parallels BO's structure of learning a surrogate model and then deciding the next action via acquisition functions. Both share the strategy of "first build a model of the world, then decide based on that model."

## Limitations and Weaknesses

BO is powerful but has clear boundaries on its applicability.

- **Curse of dimensionality**: Standard GP-based BO is effective up to roughly 10-20 dimensions. Beyond that, GP kernels struggle to capture high-dimensional structure, and optimizing the acquisition function itself becomes yet another high-dimensional optimization problem -- a paradox. This is a fundamental limitation without a complete solution to date.
- **Computational scalability**: The core GP operation of kernel matrix inversion requires O(n^3) time and O(n^2) memory. When observations exceed several thousand, GP itself becomes the bottleneck. Alternatives like sparse approximations, random forest-based SMAC (Hutter et al., 2011), and Neural Processes exist but sacrifice some of GP's uncertainty estimation quality.
- **Smoothness assumptions**: GP kernel functions (typically RBF or Matern) assume the objective function is continuous and smooth. On discontinuous functions or extremely noisy environments, this assumption breaks down and performance degrades.
- **Initial exploration overhead**: BO requires initial observations to train the GP. For simple problems with only 2-3 variables, an experienced practitioner may intuitively reach good settings in a few tries, making BO's initial exploration phase relatively inefficient.

## Glossary

Prior - the probability distribution representing initial beliefs about a hypothesis before observing data

Posterior - the probability distribution of beliefs updated via Bayes' theorem after observing data

Black-box function - a function whose internal structure is unknown, where only outputs can be observed for given inputs; gradients are not computable

Surrogate model - a low-cost probabilistic model that approximates the expensive true function; GP is standard, but random forests and neural networks are also used

Gaussian process - a probability distribution over function space; analytically computes the mean and variance of unobserved regions conditioned on observations; kernel function choice determines smoothness assumptions

Acquisition function - a function that scores the value of the next evaluation point by combining the surrogate model's predictive mean and uncertainty

Expected Improvement - an acquisition function measuring the expected magnitude of improvement over the current best value; proposed by Mockus (1974), combined with GP by Jones et al. (1998)

Kernel function - a function defining similarity between two inputs in a GP; the RBF kernel assumes higher similarity for closer distances

Hyperparameter - a value that must be set by a human before model training (learning rate, batch size, etc.); not automatically determined during the learning process

Sparse approximation - a technique using a small number of inducing points to approximate the full GP, reducing O(n^3) computation
