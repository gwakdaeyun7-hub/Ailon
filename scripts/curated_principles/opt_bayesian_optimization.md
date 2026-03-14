---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 베이지안 최적화, 가우시안 프로세스, 획득 함수, 대리 모델, 하이퍼파라미터 튜닝, 블랙박스 최적화, 탐색과 활용, 신경망 구조 탐색
keywords_en: Bayesian optimization, Gaussian process, acquisition function, surrogate model, hyperparameter tuning, black-box optimization, exploration vs exploitation, neural architecture search
---
Bayesian Optimization - 평가 비용이 높은 블랙박스 함수를 최소 횟수로 최적화하는, 확률 모델 기반의 순차적 의사결정 전략

## 블랙박스 문제라는 현실

많은 실제 최적화 문제에서 목적 함수는 블랙박스(black-box)다. 내부 구조를 모르고, 그래디언트를 계산할 수 없으며, 한 번 평가하는 데 비용이 막대하다. 신경망 학습률을 바꿔가며 검증 정확도를 측정하려면 GPU로 수 시간에서 수일이 걸린다. 신약 후보 물질의 활성을 실험으로 측정하려면 수주가 걸리고 비용은 수천만 원이다. 이런 상황에서 그리드 서치(grid search)나 랜덤 서치(random search)처럼 수백 번을 시도하는 것은 비현실적이다.

베이지안 최적화(Bayesian Optimization, BO)는 이 문제에 대한 원칙적 해법이다. 핵심 아이디어는 두 가지 요소의 결합이다. **대리 모델**(surrogate model)이 지금까지의 관측을 바탕으로 함수의 전체적 형태를 확률적으로 추정하고, **획득 함수**(acquisition function)가 다음에 어디를 평가할지를 탐색과 활용의 균형을 고려하여 결정한다.

## 역사적 흐름

BO의 지적 기원은 의외로 1960년대로 거슬러 올라간다. Kushner(1964)가 최초로 확률 모델을 사용한 순차적 최적화 전략을 제안했다. Mockus(1974)는 Expected Improvement(기대 향상)라는 획득 함수를 도입하여 이론적 기초를 놓았다. 하지만 이 아이디어들은 계산 비용 문제로 수십 년간 실용화되지 못했다.

Jones, Schonlau & Welch(1998)의 EGO(Efficient Global Optimization) 알고리즘이 전환점이었다. 가우시안 프로세스(Gaussian Process, GP)를 대리 모델로, Expected Improvement를 획득 함수로 조합하여, 공학 설계 최적화에서 탁월한 효율을 시연했다. 이후 Snoek, Larochelle & Adams(2012)가 이를 딥러닝 하이퍼파라미터 튜닝에 적용하면서 AI 커뮤니티에서 폭발적으로 주목받게 된다.

## 가우시안 프로세스: 함수 위의 분포

BO의 표준 대리 모델인 가우시안 프로세스(GP)는 "함수들의 집합 위에 정의된 확률 분포"라는 개념이다. 관측된 점들을 통과하면서도 미관측 영역에 대한 불확실성을 자연스럽게 표현한다.

n개의 관측점 (X, y)가 주어졌을 때, 새로운 점 x*에서의 GP 예측은 다음과 같다.

mu(x*) = k*^T K^(-1) y
sigma^2(x*) = k(x*, x*) - k*^T K^(-1) k*

여기서 K는 관측점 간의 커널 행렬, k*는 x*와 관측점들 사이의 커널 벡터다. mu(x*)는 예측 평균(지금까지의 데이터가 암시하는 함수 값 추정), sigma^2(x*)는 예측 분산(불확실성)이다.

관측점 근처에서는 sigma가 작고(확신), 멀리 떨어진 곳에서는 sigma가 크다(불확실). 이 **불확실성의 자동 정량화**가 GP를 대리 모델로 특별하게 만드는 핵심이다.

## 획득 함수: 어디를 다음에 볼 것인가

대리 모델이 현재 지식을 나타낸다면, 획득 함수는 다음 실험의 가치를 평가하는 기준이다.

Expected Improvement(EI)는 현재 최선값 f_best보다 얼마나 더 좋아질 것으로 기대되는지를 측정한다.

EI(x) = E[max(f_best - f(x), 0)]

이 기댓값은 GP의 mu와 sigma를 사용하여 해석적으로(closed-form) 계산된다. f_best 아래쪽 영역의 정규분포 적분이다.

Upper Confidence Bound(UCB)는 더 직관적이다.

UCB(x) = mu(x) + kappa * sigma(x)

mu(x)는 활용(exploitation) 항이고, kappa * sigma(x)는 탐색(exploration) 항이다. kappa가 크면 불확실한 영역을 더 탐색하고, 작으면 현재 좋은 영역을 활용한다. Srinivas et al.(2010)은 UCB의 이론적 후회 한계(regret bound)를 증명하여 kappa를 원칙적으로 설정하는 방법을 제시했다.

Thompson Sampling은 GP의 사후 분포에서 함수 하나를 랜덤으로 샘플링하여 그 함수의 최솟값을 다음 평가점으로 선택한다. 구현이 단순하고 병렬화에 유리하다.

## AI에서의 핵심 활용

Snoek et al.(2012)의 논문은 BO가 딥러닝 하이퍼파라미터 튜닝에서 전문가의 수동 튜닝과 랜덤 서치를 능가함을 보였다. 학습률, 배치 크기, 드롭아웃 비율, 은닉층 크기 등 연속·이산 하이퍼파라미터를 동시에 최적화했다.

이후 BO는 여러 방향으로 확장되었다. Bergstra et al.(2011)의 TPE(Tree-structured Parzen Estimator)는 GP 대신 비모수적 밀도 추정을 사용하여 범주형 변수와 조건부 하이퍼파라미터를 자연스럽게 처리한다. Falkner et al.(2018)의 BOHB는 BO와 Hyperband의 조기 종료 전략을 결합하여 대규모 탐색 공간에서의 효율을 높였다. 신경망 구조 탐색(NAS)에서도 BO가 활용되어, 아키텍처 선택이라는 구조적 최적화 문제에 적용되었다.

## 대리 모델의 진화

GP의 핵심 한계는 O(n^3) 시간 복잡도로, 관측 수 n이 수천을 넘으면 계산이 비현실적이다. 이를 극복하기 위한 다양한 대리 모델이 제안되었다. 랜덤 포레스트 기반의 SMAC(Hutter et al., 2011), 베이지안 신경망 기반 접근, 그리고 희소(sparse) GP 근사 등이 있다.

최근에는 신경망 자체를 대리 모델로 쓰는 연구도 활발하다. 뉴럴 프로세스(Neural Process)와 딥 앙상블이 GP를 대체하여 고차원 입력과 대규모 데이터에 대응한다.

## 한계와 약점

BO는 강력하지만 적용 범위에 명확한 경계가 있다.

- **차원의 저주**: 표준 GP 기반 BO는 약 10~20차원까지 효과적이다. 그 이상에서는 GP의 커널이 고차원 공간의 구조를 포착하기 어려워지고, 획득 함수 최적화 자체가 고차원 최적화 문제가 된다. 이는 근본적 한계이며, 현재까지 완전한 해결책은 없다.
- **GP 확장성**: O(n^3) 시간, O(n^2) 메모리로, 관측이 수만 건을 넘기면 표준 GP는 사용 불가하다. 희소 근사나 대안 모델은 GP의 불확실성 추정 품질을 다소 희생한다.
- **획득 함수 최적화의 역설**: EI나 UCB를 최적화하는 것 자체가 또 다른 최적화 문제다. 대리 모델이 복잡한 다봉(multimodal) 형태일 때, 획득 함수의 전역 최적을 찾는 것은 자명하지 않다.
- **가정의 한계**: GP의 매끄러움(smoothness) 가정이 맞지 않는 불연속 함수나 극도로 노이즈가 큰 함수에서는 성능이 저하된다.
- **인간 전문가와의 비교**: 소수의 하이퍼파라미터에 대해 경험 많은 전문가가 직관적으로 빠르게 좋은 설정에 도달하는 경우, BO의 초기 탐색 오버헤드가 오히려 비효율적일 수 있다.

## 용어 정리

블랙박스 함수(black-box function) - 내부 구조를 모르고, 입력을 넣으면 출력만 관측할 수 있는 함수. 그래디언트 계산 불가

대리 모델(surrogate model) - 비용이 높은 실제 함수를 근사하는 저비용 확률 모델. GP가 표준이지만 랜덤 포레스트, 신경망 등도 사용

획득 함수(acquisition function) - 대리 모델의 예측과 불확실성을 조합하여 다음 평가점의 가치를 점수화하는 함수

가우시안 프로세스(Gaussian process) - 함수 공간 위의 확률 분포. 관측점을 조건으로 미관측 영역의 평균과 분산을 해석적으로 계산

기대 향상(Expected Improvement) - 현재 최선값을 초과할 기대 크기를 측정하는 획득 함수. Mockus(1974) 제안

상한 신뢰 구간(Upper Confidence Bound) - 예측 평균에 불확실성의 가중합을 더하는 획득 함수. kappa 파라미터로 탐색-활용 비율 조절

커널 함수(kernel function) - GP에서 두 입력 사이의 유사도를 정의하는 함수. 선택에 따라 GP가 가정하는 함수의 매끄러움이 달라짐

하이퍼파라미터(hyperparameter) - 모델 학습 전에 설정해야 하는 값(학습률, 배치 크기 등). 학습 과정에서 자동으로 결정되지 않음

희소 근사(sparse approximation) - GP의 O(n^3) 계산을 줄이기 위해 유도점(inducing points)을 사용하는 근사 기법

---EN---
Bayesian Optimization - A sequential decision-making strategy based on probabilistic models for optimizing expensive-to-evaluate black-box functions with minimal evaluations

## The Reality of Black-Box Problems

In many real-world optimization problems, the objective function is a black box. Its internal structure is unknown, gradients cannot be computed, and each evaluation is enormously expensive. Testing neural network learning rates by measuring validation accuracy takes hours to days on GPUs. Measuring a drug candidate's activity experimentally takes weeks and costs tens of thousands of dollars. In such settings, trying hundreds of evaluations via grid search or random search is impractical.

Bayesian Optimization (BO) is a principled solution to this problem. The core idea combines two elements: a **surrogate model** probabilistically estimates the function's overall shape from observations so far, and an **acquisition function** determines where to evaluate next by balancing exploration and exploitation.

## Historical Trajectory

BO's intellectual origins surprisingly trace back to the 1960s. Kushner (1964) first proposed a sequential optimization strategy using probabilistic models. Mockus (1974) introduced Expected Improvement as an acquisition function, laying the theoretical foundation. However, these ideas remained impractical for decades due to computational costs.

Jones, Schonlau & Welch's (1998) EGO (Efficient Global Optimization) algorithm was the turning point. By combining a Gaussian Process (GP) as the surrogate model with Expected Improvement as the acquisition function, they demonstrated outstanding efficiency in engineering design optimization. Snoek, Larochelle & Adams (2012) then applied this to deep learning hyperparameter tuning, triggering an explosion of interest in the AI community.

## Gaussian Processes: Distributions over Functions

The standard surrogate model in BO, the Gaussian Process (GP), is conceptually "a probability distribution defined over a collection of functions." It passes through observed points while naturally expressing uncertainty about unobserved regions.

Given n observations (X, y), the GP prediction at a new point x* is:

mu(x*) = k*^T K^(-1) y
sigma^2(x*) = k(x*, x*) - k*^T K^(-1) k*

Here K is the kernel matrix between observation points, and k* is the kernel vector between x* and the observations. mu(x*) is the predictive mean (function value estimate implied by data), and sigma^2(x*) is the predictive variance (uncertainty).

Near observed points, sigma is small (confident); far away, sigma is large (uncertain). This **automatic quantification of uncertainty** is what makes GP uniquely powerful as a surrogate model.

## Acquisition Functions: Where to Look Next

If the surrogate model represents current knowledge, the acquisition function evaluates the value of the next experiment.

Expected Improvement (EI) measures how much improvement over the current best f_best is expected:

EI(x) = E[max(f_best - f(x), 0)]

This expectation is computed analytically (closed-form) using the GP's mu and sigma -- it is the integral of the normal distribution below f_best.

Upper Confidence Bound (UCB) is more intuitive:

UCB(x) = mu(x) + kappa * sigma(x)

mu(x) is the exploitation term and kappa * sigma(x) is the exploration term. Larger kappa explores uncertain regions more; smaller kappa exploits known good regions. Srinivas et al. (2010) proved theoretical regret bounds for UCB, providing a principled way to set kappa.

Thompson Sampling randomly draws a function from the GP posterior and selects that function's minimum as the next evaluation point. It is simple to implement and favorable for parallelization.

## Core Applications in AI

Snoek et al.'s (2012) paper demonstrated that BO outperforms both expert manual tuning and random search for deep learning hyperparameter optimization, simultaneously optimizing continuous and discrete hyperparameters such as learning rate, batch size, dropout rate, and hidden layer sizes.

BO has since expanded in several directions. Bergstra et al.'s (2011) TPE (Tree-structured Parzen Estimator) uses nonparametric density estimation instead of GP, naturally handling categorical and conditional hyperparameters. Falkner et al.'s (2018) BOHB combines BO with Hyperband's early stopping strategy for efficiency in large search spaces. BO has also been applied to neural architecture search (NAS), addressing architecture selection as a structural optimization problem.

## Evolution of Surrogate Models

GP's core limitation is O(n^3) time complexity, making computation impractical when observations exceed several thousand. Various alternative surrogate models have been proposed: random forest-based SMAC (Hutter et al., 2011), Bayesian neural network approaches, and sparse GP approximations.

Recent research actively explores using neural networks themselves as surrogate models. Neural Processes and deep ensembles replace GP to handle high-dimensional inputs and large datasets.

## Limitations and Weaknesses

BO is powerful but has clear boundaries on its applicability.

- **Curse of dimensionality**: Standard GP-based BO is effective up to roughly 10-20 dimensions. Beyond that, GP kernels struggle to capture high-dimensional structure, and acquisition function optimization itself becomes a high-dimensional optimization problem. This is a fundamental limitation without a complete solution to date.
- **GP scalability**: With O(n^3) time and O(n^2) memory, standard GP becomes unusable beyond tens of thousands of observations. Sparse approximations and alternative models sacrifice some of GP's uncertainty estimation quality.
- **The paradox of acquisition function optimization**: Optimizing EI or UCB is itself another optimization problem. When the surrogate model has complex multimodal shapes, finding the global optimum of the acquisition function is non-trivial.
- **Assumption limitations**: Performance degrades on discontinuous functions or extremely noisy functions that violate GP's smoothness assumptions.
- **Comparison with human experts**: For a small number of hyperparameters, an experienced practitioner may intuitively reach good settings quickly, making BO's initial exploration overhead relatively inefficient.

## Glossary

Black-box function - a function whose internal structure is unknown, where only outputs can be observed for given inputs; gradients are not computable

Surrogate model - a low-cost probabilistic model that approximates the expensive true function; GP is standard, but random forests and neural networks are also used

Acquisition function - a function that scores the value of the next evaluation point by combining the surrogate model's predictions and uncertainty

Gaussian process - a probability distribution over function space; analytically computes the mean and variance of unobserved regions conditioned on observations

Expected Improvement - an acquisition function measuring the expected magnitude of improvement over the current best value; proposed by Mockus (1974)

Upper Confidence Bound - an acquisition function that adds a weighted uncertainty term to the predictive mean; kappa parameter controls the exploration-exploitation ratio

Kernel function - a function defining similarity between two inputs in a GP; the choice determines the smoothness assumptions of the GP

Hyperparameter - a value that must be set before model training (learning rate, batch size, etc.); not automatically determined during the learning process

Sparse approximation - an approximation technique using inducing points to reduce GP's O(n^3) computation
