---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 편향-분산 트레이드오프, 과적합, 과소적합, 이중 하강, 정규화, 앙상블, 교차 검증, 일반화
keywords_en: bias-variance tradeoff, overfitting, underfitting, double descent, regularization, ensemble methods, cross-validation, generalization
---
Bias-Variance Tradeoff - 모델 복잡도와 일반화 사이의 근본적 긴장 관계, 그리고 딥러닝이 깨뜨린 고전적 패러다임

## 통계적 학습의 근본 딜레마

모든 예측 모델은 두 가지 오류원에 직면한다. 하나는 모델이 너무 단순해서 데이터의 패턴을 포착하지 못하는 것(**편향**), 다른 하나는 모델이 너무 복잡해서 데이터의 잡음까지 학습하는 것(**분산**)이다. 이 둘은 시소처럼 작동한다. 한쪽을 줄이면 다른 쪽이 올라간다.

Geman, Bienenstock, Doursat(1992)가 이 트레이드오프를 신경망의 맥락에서 체계적으로 분석한 논문은 기계학습 이론의 이정표가 되었다. 그러나 이 원리의 뿌리는 더 깊다. 통계학에서 추정량의 평균제곱오차(MSE)를 편향 제곱과 분산으로 분해하는 것은 오래된 기본 개념이다.

## 오차 분해: 수식의 의미

제곱 손실(squared loss)을 가정할 때, 예측의 기대 오차는 다음과 같이 분해된다.

E[(y - f_hat(x))^2] = Bias(f_hat)^2 + Var(f_hat) + sigma^2

각 항은 다음을 의미한다.

Bias(f_hat) = E[f_hat(x)] - f(x)

편향은 모델 예측의 기댓값이 참값에서 얼마나 벗어나는지를 측정한다. 다양한 훈련 데이터셋으로 모델을 반복 학습시켰을 때, 예측의 평균이 참값에서 체계적으로 빗나가는 정도다. 단순한 모델(예: 선형 회귀로 비선형 패턴을 맞출 때)은 높은 편향을 갖는다.

Var(f_hat) = E[(f_hat(x) - E[f_hat(x)])^2]

분산은 훈련 데이터에 따라 모델 예측이 얼마나 변동하는지를 측정한다. 복잡한 모델은 훈련 데이터의 작은 변화에도 크게 반응하여 높은 분산을 갖는다.

sigma^2 = **환원불가능한 잡음**(irreducible noise)

데이터 자체에 내재된 랜덤성으로, 어떤 모델로도 제거할 수 없다. 이것이 예측 정확도의 이론적 하한이다.

## 고전적 U자 곡선

고전적 기계학습 이론에서 모델 복잡도를 가로축, 테스트 오차를 세로축에 놓으면 U자 곡선이 그려진다.

- 왼쪽 영역(과소적합): 모델이 너무 단순하다. 편향이 높고 분산이 낮다. 훈련 데이터의 패턴조차 제대로 학습하지 못한다.
- 중앙(최적점): 편향과 분산의 합이 최소인 "스위트 스팟"이다. 이 지점에서 일반화 성능이 가장 좋다.
- 오른쪽 영역(과적합): 모델이 너무 복잡하다. 편향이 낮지만 분산이 높다. 훈련 데이터에는 완벽하지만 새 데이터에 실패한다.

이 프레임워크는 수십 년간 모델 선택의 지침이었다. **교차 검증**(cross-validation)은 이 **U자 곡선**에서 최적 복잡도를 찾는 실용적 도구다.

## AI에서의 직접적 적용

편향-분산 트레이드오프는 현대 AI의 핵심 기법들을 이론적으로 뒷받침한다.

배깅과 랜덤 포레스트: Breiman(1996)의 **배깅**(Bootstrap Aggregating)은 **분산을 줄이는** 전략이다. 여러 개의 높은 분산 모델(예: 깊은 결정 트리)을 독립적으로 학습시킨 뒤 평균을 내면, 편향은 유지하면서 분산이 모델 수에 반비례하여 줄어든다. 랜덤 포레스트는 특성 샘플링을 추가하여 트리 간 상관관계를 더 줄인다.

부스팅: AdaBoost(Freund & Schapire 1997)와 XGBoost(Chen & Guestrin 2016)는 반대 방향으로 작동한다. 높은 편향 모델(예: 얕은 결정 트리)을 순차적으로 쌓으면서 이전 모델의 잔차(오류)를 학습한다. 각 단계가 편향을 줄이지만, 과도하면 분산이 올라간다.

L1/L2 정규화: L2 정규화(Ridge)는 가중치를 0에 가깝게 당겨 모델 복잡도를 제한하고, 편향을 약간 올리는 대가로 분산을 크게 줄인다. L1 정규화(Lasso)는 일부 가중치를 정확히 0으로 만들어 변수 선택 효과까지 제공한다.

드롭아웃: Srivastava et al.(2014)의 드롭아웃은 훈련 중 무작위로 뉴런을 제거하여 모든 뉴런이 독립적으로 유용한 특성을 학습하도록 강제한다. 이는 암묵적 앙상블로 해석되며, 분산을 줄이는 효과가 있다.

## 이중 하강: 고전 이론이 깨지다

2019년, Belkin, Hsu, Ma, Mandal이 발표한 "Reconciling modern machine-learning practice and the bias-variance trade-off"는 기계학습 이론의 지형도를 바꾸었다. 그들이 발견한 현상은 다음과 같다.

모델 복잡도를 계속 키우면, 전통적 U자 곡선의 오른쪽(과적합 영역)에서 테스트 오차가 한 번 치솟은 뒤, **다시 감소**한다. 이것이 이중 하강(double descent)이다.

핵심은 **보간 임계점(interpolation threshold)**에 있다. 모델 파라미터 수가 훈련 데이터 수와 같아지는 지점에서 테스트 오차가 최대가 된다. 이 지점에서 모델은 훈련 데이터를 정확히 암기하면서도 가장 "과격한" 방식으로 그렇게 한다. 파라미터 수가 이 임계점을 넘어서면, 모델은 여전히 훈련 데이터를 완벽히 맞추지만 "더 부드러운" 방식으로 보간하게 되고, 오히려 일반화가 개선된다.

이 현상은 랜덤 포레스트, 부스팅, 신경망 등 다양한 모델에서 관찰되었다. Nakkiran et al.(2021)은 이를 에포크 단위에서도 확인했다(epoch-wise double descent).

## 과매개변수화의 수수께끼

이중 하강은 더 근본적인 질문을 던진다. "왜 수십억 개의 파라미터를 가진 모델이 과적합하지 않는가?"

현대 심층 신경망은 훈련 데이터를 완벽히 암기할 수 있는(심지어 무작위 레이블까지) 과매개변수화(overparameterized) 상태다. 고전 이론에 따르면 극심한 과적합이 발생해야 한다. 그러나 실제로는 뛰어난 일반화 성능을 보인다.

이를 설명하려는 여러 가설이 경쟁하고 있다. 확률적 경사하강법(SGD)의 암묵적 정규화 효과(SGD가 기울기의 잡음 때문에 "평탄한" 극솟값으로 편향된다), 신경망의 신경 접선 커널(NTK) 분석, 그리고 정보 압축 관점 등이다. 2025년 현재에도 이론적 합의에는 도달하지 못했다.

## 한계와 약점

- **제곱 손실 의존성**: 고전적 편향-분산 분해는 제곱 손실을 가정한다. 교차 엔트로피나 0-1 손실과 같은 다른 손실함수에서는 이 깔끔한 분해가 성립하지 않는다. James(2003)와 Domingos(2000)가 일반 손실함수에 대한 확장을 시도했지만, 제곱 손실만큼 직관적이지 않다.
- **실무적 측정 불가**: 편향과 분산은 "모든 가능한 훈련 데이터셋에 대한 기댓값"으로 정의되므로, 실제로는 직접 측정할 수 없다. 교차 검증이 대안이지만, 편향과 분산을 분리하여 보여주지는 못한다.
- **딥러닝에서의 불완전한 설명력**: 이중 하강과 과매개변수화 현상은 고전적 편향-분산 프레임워크로 완전히 설명되지 않는다. 이 이론은 여전히 유용한 직관을 제공하지만, 현대 딥러닝의 일반화를 이해하는 완전한 렌즈는 아니다.
- **모델 가정의 한계**: 분해는 학습 알고리즘이 아닌 모델 클래스에 대해 정의된다. 같은 모델이라도 최적화 방법(SGD vs Adam)에 따라 일반화 성능이 달라지는데, 편향-분산 분해는 이를 포착하지 못한다.

## 용어 정리

편향(bias) - 모델 예측의 체계적 오차. 모든 가능한 훈련 셋에 대한 예측 평균과 참값의 차이

분산(variance) - 훈련 데이터 변화에 따른 모델 예측의 변동성. 높을수록 특정 훈련 셋에 민감

환원불가능 잡음(irreducible noise) - 데이터 자체에 내재한 랜덤성. 어떤 모델로도 제거 불가

과적합(overfitting) - 모델이 훈련 데이터의 잡음까지 학습하여 새 데이터에 일반화하지 못하는 현상

과소적합(underfitting) - 모델이 너무 단순하여 훈련 데이터의 패턴조차 포착하지 못하는 현상

이중 하강(double descent) - 보간 임계점을 넘어 모델 복잡도를 더 키우면 테스트 오차가 다시 감소하는 현상. Belkin et al.(2019)

보간 임계점(interpolation threshold) - 모델 파라미터 수가 훈련 데이터 수와 같아지는 지점. 이중 하강에서 테스트 오차 피크

교차 검증(cross-validation) - 데이터를 반복적으로 훈련/검증 셋으로 나누어 모델 일반화 성능을 추정하는 방법

배깅(bagging, bootstrap aggregating) - 여러 모델의 예측을 평균내어 분산을 줄이는 앙상블 기법. Breiman(1996)

과매개변수화(overparameterization) - 모델 파라미터 수가 훈련 데이터 수보다 많은 상태. 현대 심층 신경망의 일반적 특성

---EN---
Bias-Variance Tradeoff - The fundamental tension between model complexity and generalization, and how deep learning broke the classical paradigm

## The Fundamental Dilemma of Statistical Learning

Every predictive model faces two sources of error. One is the model being too simple to capture patterns in the data (**bias**). The other is the model being too complex and learning noise in the data (**variance**). The two work like a seesaw: reducing one raises the other.

The 1992 paper by Geman, Bienenstock, and Doursat, which systematically analyzed this tradeoff in the context of neural networks, became a milestone in machine learning theory. But the principle's roots go deeper. Decomposing an estimator's mean squared error (MSE) into squared bias and variance has long been a fundamental concept in statistics.

## Error Decomposition: What the Formula Means

Assuming squared loss, the expected prediction error decomposes as:

E[(y - f_hat(x))^2] = Bias(f_hat)^2 + Var(f_hat) + sigma^2

Each term means:

Bias(f_hat) = E[f_hat(x)] - f(x)

Bias measures how far the expected model prediction deviates from the true value. When training the model repeatedly on various training datasets, it is the degree to which the average prediction systematically misses the true value. Simple models (e.g., fitting a nonlinear pattern with linear regression) have high bias.

Var(f_hat) = E[(f_hat(x) - E[f_hat(x)])^2]

Variance measures how much model predictions fluctuate depending on the training data. Complex models react strongly to small changes in training data, exhibiting high variance.

sigma^2 = **Irreducible noise**

Randomness inherent in the data itself, which no model can eliminate. This is the theoretical lower bound on prediction accuracy.

## The Classical U-Curve

In classical machine learning theory, plotting model complexity on the x-axis and test error on the y-axis draws a U-shaped curve.

- Left region (underfitting): Model is too simple. High bias, low variance. Cannot even learn patterns in the training data.
- Center (sweet spot): The sum of bias and variance is minimized. Generalization performance is best here.
- Right region (overfitting): Model is too complex. Low bias but high variance. Perfect on training data, fails on new data.

This framework guided model selection for decades. **Cross-validation** is the practical tool for finding optimal complexity on this **U-curve**.

## Direct Applications in AI

The bias-variance tradeoff provides theoretical backing for core modern AI techniques.

Bagging and Random Forests: Breiman's (1996) **bagging** (Bootstrap Aggregating) is a **variance reduction** strategy. Training multiple high-variance models (e.g., deep decision trees) independently and averaging them reduces variance inversely proportional to the number of models while maintaining bias. Random Forest further reduces inter-tree correlation through feature sampling.

Boosting: AdaBoost (Freund & Schapire 1997) and XGBoost (Chen & Guestrin 2016) work in the opposite direction. They sequentially stack high-bias models (e.g., shallow decision trees) that learn from the residuals (errors) of previous models. Each step reduces bias, but going too far increases variance.

L1/L2 regularization: L2 regularization (Ridge) pulls weights toward zero, constraining model complexity and greatly reducing variance at the cost of slightly increased bias. L1 regularization (Lasso) sets some weights to exactly zero, also providing variable selection.

Dropout: Srivastava et al.'s (2014) Dropout randomly removes neurons during training, forcing all neurons to independently learn useful features. This can be interpreted as an implicit ensemble, with a variance-reducing effect.

## Double Descent: The Classical Theory Breaks

In 2019, Belkin, Hsu, Ma, and Mandal published "Reconciling modern machine-learning practice and the bias-variance trade-off," reshaping the landscape of machine learning theory. Their discovery:

As model complexity continues to increase, test error spikes at the right side of the traditional U-curve (overfitting region), then **decreases again**. This is double descent.

The key lies at the **interpolation threshold** -- the point where the number of model parameters equals the number of training data points. Test error peaks here. At this point, the model memorizes the training data exactly but does so in the most "aggressive" way possible. When the parameter count exceeds this threshold, the model still perfectly fits the training data but interpolates in a "smoother" manner, actually improving generalization.

This phenomenon has been observed across decision forests, boosting, and neural networks. Nakkiran et al. (2021) confirmed it at the epoch level as well (epoch-wise double descent).

## The Mystery of Overparameterization

Double descent raises a more fundamental question: "Why don't models with billions of parameters overfit?"

Modern deep neural networks are overparameterized -- capable of perfectly memorizing training data (even random labels). According to classical theory, severe overfitting should occur. Yet in practice, they exhibit excellent generalization.

Several competing hypotheses attempt to explain this: the implicit regularization effect of SGD (noise in gradients biases SGD toward "flat" minima), Neural Tangent Kernel (NTK) analysis, and information compression perspectives. As of 2025, no theoretical consensus has been reached.

## Limitations and Weaknesses

- **Squared loss dependence**: The classical bias-variance decomposition assumes squared loss. For other loss functions like cross-entropy or 0-1 loss, this clean decomposition does not hold. James (2003) and Domingos (2000) attempted extensions to general loss functions, but none are as intuitive as the squared loss case.
- **Practical immeasurability**: Bias and variance are defined as expectations over "all possible training datasets," making them impossible to measure directly. Cross-validation is an alternative but cannot separately display bias and variance.
- **Incomplete explanatory power for deep learning**: Double descent and overparameterization phenomena are not fully explained by the classical bias-variance framework. The theory still provides useful intuition but is not a complete lens for understanding modern deep learning generalization.
- **Model assumption limitations**: The decomposition is defined for model classes, not learning algorithms. Even with the same model, generalization performance varies by optimizer (SGD vs Adam), but the bias-variance decomposition cannot capture this.

## Glossary

Bias - the systematic error in model predictions; the difference between the average prediction over all possible training sets and the true value

Variance - the variability of model predictions due to changes in training data; higher variance means greater sensitivity to a specific training set

Irreducible noise - randomness inherent in the data itself; cannot be eliminated by any model

Overfitting - a model learning noise in the training data, failing to generalize to new data

Underfitting - a model being too simple to capture even the patterns in training data

Double descent - the phenomenon where test error decreases again after the interpolation threshold as model complexity grows further; Belkin et al. (2019)

Interpolation threshold - the point where the number of model parameters equals the number of training data points; the test error peak in double descent

Cross-validation - a method of estimating model generalization performance by repeatedly splitting data into training and validation sets

Bagging (bootstrap aggregating) - an ensemble technique that reduces variance by averaging predictions from multiple models; Breiman (1996)

Overparameterization - the state where the number of model parameters exceeds the number of training data points; a general characteristic of modern deep neural networks
